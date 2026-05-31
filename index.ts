
import { Client, GatewayIntentBits } from "discord.js";
import {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes,
  ChatInputCommandInteraction,
  Interaction,
  PermissionFlagsBits,
  EmbedBuilder,
  Message,
  TextChannel,
} from "discord.js";
import { logger } from "../lib/logger.js";
import { GoogleGenAI } from "@google/genai";
// ─────────────────────────────────────────────
// In-memory Store
// ─────────────────────────────────────────────
const xpStore = new Map<string, { xp: number; level: number }>();
const creditsStore = new Map<string, number>();
const xpCooldown = new Map<string, number>();
const timedBans = new Map<string, NodeJS.Timeout>();
const timedMutes = new Map<string, NodeJS.Timeout>();
function key(guildId: string, userId: string) {
  return `${guildId}:${userId}`;
}
function getXP(guildId: string, userId: string) {
  return xpStore.get(key(guildId, userId)) ?? { xp: 0, level: 0 };
}
function addXP(guildId: string, userId: string, amount: number) {
  const k = key(guildId, userId);
  const data = xpStore.get(k) ?? { xp: 0, level: 0 };
  data.xp += amount;
  const needed = (data.level + 1) * 100;
  let leveledUp = false;
  if (data.xp >= needed) {
    data.xp -= needed;
    data.level += 1;
    leveledUp = true;
    // مكافأة عند رفع المستوى
    const ck = key(guildId, userId);
    creditsStore.set(ck, (creditsStore.get(ck) ?? 0) + data.level * 50);
  }
  xpStore.set(k, data);
  return { leveledUp, newLevel: data.level };
}
// ─────────────────────────────────────────────
// Time Parser  →  s م  h  w  mh  y
// ─────────────────────────────────────────────
function parseTime(input: string): number | null {
  const m = input.trim().match(/^(\d+)(s|m|h|w|mh|y)$/i);
  if (!m) return null;
  const v = parseInt(m[1]);
  const u = m[2].toLowerCase();
  const map: Record<string, number> = {
    s: 1_000,
    m: 60_000,
    h: 3_600_000,
    w: 604_800_000,
    mh: 2_592_000_000,
    y: 31_536_000_000,
  };
  return v * map[u];
}
function labelTime(input: string): string {
  const m = input.trim().match(/^(\d+)(s|m|h|w|mh|y)$/i);
  if (!m) return input;
  const labels: Record<string, string> = {
    s: "ثانية", m: "دقيقة", h: "ساعة", w: "أسبوع", mh: "شهر", y: "سنة",
  };
  return `${m[1]} ${labels[m[2].toLowerCase()]}`;
}
// ─────────────────────────────────────────────
// AI
// ─────────────────────────────────────────────
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
const aiChatSessions = new Map<string, string>(); // threadId → userId
// ─────────────────────────────────────────────
// Slash Commands definitions
// ─────────────────────────────────────────────
const slashDefs = [
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("قياس سرعة استجابة البوت"),
  new SlashCommandBuilder()
    .setName("ban")
    .setDescription("حظر عضو من السيرفر")
    .addUserOption(o => o.setName("user").setDescription("العضو").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("السبب"))
    .addStringOption(o => o.setName("duration").setDescription("المدة (مثال: 10m، 2h، 1w، 1mh، 1y)"))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  new SlashCommandBuilder()
    .setName("unban")
    .setDescription("رفع الحظر عن عضو")
    .addStringOption(o => o.setName("userid").setDescription("ID العضو").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  new SlashCommandBuilder()
    .setName("kick")
    .setDescription("طرد عضو من السيرفر")
    .addUserOption(o => o.setName("user").setDescription("العضو").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("السبب"))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
  new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("إسكات عضو مؤقتاً (يمنعه من الكلام)")
    .addUserOption(o => o.setName("user").setDescription("العضو").setRequired(true))
    .addStringOption(o => o.setName("duration").setDescription("المدة (مثال: 10m، 2h، 1w)").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("السبب"))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  new SlashCommandBuilder()
    .setName("untimeout")
    .setDescription("رفع الإسكات عن عضو")
    .addUserOption(o => o.setName("user").setDescription("العضو").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  new SlashCommandBuilder()
    .setName("mute")
    .setDescription("كتم عضو في القناة الصوتية")
    .addUserOption(o => o.setName("user").setDescription("العضو").setRequired(true))
    .addStringOption(o => o.setName("duration").setDescription("المدة (مثال: 10m، 2h)"))
    .addStringOption(o => o.setName("reason").setDescription("السبب"))
    .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers),
  new SlashCommandBuilder()
    .setName("unmute")
    .setDescription("رفع الكتم عن عضو في القناة الصوتية")
    .addUserOption(o => o.setName("user").setDescription("العضو").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers),
  new SlashCommandBuilder()
    .setName("clear")
    .setDescription("حذف رسائل (حتى 1000 رسالة بدفعات من 100)")
    .addIntegerOption(o =>
      o.setName("amount").setDescription("عدد الرسائل (1-1000)").setRequired(true).setMinValue(1).setMaxValue(1000)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  new SlashCommandBuilder()
    .setName("levels")
    .setDescription("لوحة ترتيب الخبرة في السيرفر"),
  new SlashCommandBuilder()
    .setName("profile")
    .setDescription("عرض بروفايل عضو")
    .addUserOption(o => o.setName("user").setDescription("العضو (فارغ = بروفايلك)")),
  new SlashCommandBuilder()
    .setName("credits")
    .setDescription("عرض رصيد الكريدت")
    .addUserOption(o => o.setName("user").setDescription("العضو")),
  new SlashCommandBuilder()
    .setName("serverinfo")
    .setDescription("معلومات السيرفر الحالي"),
  new SlashCommandBuilder()
    .setName("ask-ai")
    .setDescription("اسأل الذكاء الاصطناعي سؤالاً واحداً")
    .addStringOption(o => o.setName("question").setDescription("سؤالك").setRequired(true)),
  new SlashCommandBuilder()
    .setName("ai-chat")
    .setDescription("فتح جلسة محادثة مع الذكاء الاصطناعي في thread خاص"),
];
// ─────────────────────────────────────────────
// Helper: sleep
// ─────────────────────────────────────────────
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
// ─────────────────────────────────────────────
// Command Handlers
// ─────────────────────────────────────────────
async function handleCommand(interaction: ChatInputCommandInteraction) {
  const { commandName, guild, user } = interaction;
  // ── /ping ──────────────────────────────────
  if (commandName === "ping") {
    const ws = interaction.client.ws.ping;
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x5865f2)
          .setTitle("🏓 Pong!")
          .addFields(
            { name: "تأخير WebSocket", value: `\`${ws}ms\``, inline: true },
            { name: "وقت الاستجابة", value: `\`${Date.now() - interaction.createdTimestamp}ms\``, inline: true }
          )
      ]
    });
    return;
  }
  // ── /ban ───────────────────────────────────
  if (commandName === "ban") {
    const target = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason") ?? "لم يُذكر سبب";
    const durationStr = interaction.options.getString("duration");
    const member = await guild!.members.fetch(target.id).catch(() => null);
    if (!member) return interaction.reply({ content: "❌ العضو غير موجود.", flags: 64 });
    if (!member.bannable) return interaction.reply({ content: "❌ لا أستطيع حظر هذا العضو.", flags: 64 });
    await guild!.members.ban(target.id, { reason });
    if (durationStr) {
      const ms = parseTime(durationStr);
      if (!ms) return interaction.reply({ content: "❌ صيغة الوقت خاطئة. مثال: 10m، 2h، 1w", flags: 64 });
      const banKey = `${guild!.id}:${target.id}`;
      if (timedBans.has(banKey)) clearTimeout(timedBans.get(banKey)!);
      timedBans.set(banKey, setTimeout(async () => {
        await guild!.members.unban(target.id, "انتهت مدة الحظر").catch(() => {});
        timedBans.delete(banKey);
      }, ms));
      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(0xed4245)
          .setTitle("🔨 تم الحظر المؤقت")
          .addFields(
            { name: "العضو", value: `${target}`, inline: true },
            { name: "المدة", value: labelTime(durationStr), inline: true },
            { name: "السبب", value: reason }
          )]
      });
    } else {
      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(0xed4245)
          .setTitle("🔨 تم الحظر")
          .addFields(
            { name: "العضو", value: `${target}`, inline: true },
            { name: "السبب", value: reason }
          )]
      });
    }
    return;
  }
  // ── /unban ─────────────────────────────────
  if (commandName === "unban") {
    const userId = interaction.options.getString("userid", true);
    await guild!.members.unban(userId, "رفع الحظر بواسطة مشرف").catch(() => null);
    const banKey = `${guild!.id}:${userId}`;
    if (timedBans.has(banKey)) { clearTimeout(timedBans.get(banKey)!); timedBans.delete(banKey); }
    await interaction.reply({
      embeds: [new EmbedBuilder().setColor(0x57f287).setTitle("✅ تم رفع الحظر").setDescription(`تم رفع الحظر عن العضو ذو ID: \`${userId}\``)]
    });
    return;
  }
  // ── /kick ──────────────────────────────────
  if (commandName === "kick") {
    const target = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason") ?? "لم يُذكر سبب";
    const member = await guild!.members.fetch(target.id).catch(() => null);
    if (!member) return interaction.reply({ content: "❌ العضو غير موجود.", flags: 64 });
    if (!member.kickable) return interaction.reply({ content: "❌ لا أستطيع طرد هذا العضو.", flags: 64 });
    await member.kick(reason);
    await interaction.reply({
      embeds: [new EmbedBuilder().setColor(0xfaa81a)
        .setTitle("👢 تم الطرد")
        .addFields(
          { name: "العضو", value: `${target}`, inline: true },
          { name: "السبب", value: reason }
        )]
    });
    return;
  }
  // ── /timeout ───────────────────────────────
  if (commandName === "timeout") {
    const target = interaction.options.getUser("user", true);
    const durationStr = interaction.options.getString("duration", true);
    const reason = interaction.options.getString("reason") ?? "لم يُذكر سبب";
    const ms = parseTime(durationStr);
    if (!ms) return interaction.reply({ content: "❌ صيغة الوقت خاطئة. مثال: 10m، 2h، 1w", flags: 64 });
    const maxTimeout = 28 * 24 * 60 * 60 * 1000; // 28 يوم حد Discord
    const member = await guild!.members.fetch(target.id).catch(() => null);
    if (!member) return interaction.reply({ content: "❌ العضو غير موجود.", flags: 64 });
    if (!member.moderatable) return interaction.reply({ content: "❌ لا أستطيع إسكات هذا العضو.", flags: 64 });
    await member.timeout(Math.min(ms, maxTimeout), reason);
    await interaction.reply({
      embeds: [new EmbedBuilder().setColor(0xfaa81a)
        .setTitle("⏱️ تم الإسكات")
        .addFields(
          { name: "العضو", value: `${target}`, inline: true },
          { name: "المدة", value: labelTime(durationStr), inline: true },
          { name: "السبب", value: reason }
        )]
    });
    return;
  }
  // ── /untimeout ─────────────────────────────
  if (commandName === "untimeout") {
    const target = interaction.options.getUser("user", true);
    const member = await guild!.members.fetch(target.id).catch(() => null);
    if (!member) return interaction.reply({ content: "❌ العضو غير موجود.", flags: 64 });
    await member.timeout(null);
    await inter...
[truncated]
[truncated]
-1
+1
[truncated]
[truncated]
const commands = [
  { name: "/ban", category: "إشراف", desc: "حظر عضو من السيرفر" },
  { name: "/unban", category: "إشراف", desc: "رفع الحظر عن عضو" },
  { name: "/timeout", category: "إشراف", desc: "إسكات عضو مؤقتاً" },
  { name: "/untimeout", category: "إشراف", desc: "رفع الإسكات عن عضو" },
  { name: "/mute", category: "إشراف", desc: "كتم عضو في القناة" },
  { name: "/clear", category: "إشراف", desc: "حذف عدد من الرسائل" },
  { name: "/warn", category: "تحذيرات", desc: "تحذير عضو" },
  { name: "/warns", category: "تحذيرات", desc: "عرض تحذيرات عضو" },
  { name: "/unwarn", category: "تحذيرات", desc: "حذف تحذير معين" },
  { name: "/warnlist", category: "تحذيرات", desc: "قائمة كل التحذيرات" },
  { name: "/giverole", category: "أدوار", desc: "إعطاء رتبة لعضو" },
  { name: "/roleremove", category: "أدوار", desc: "سحب رتبة من عضو" },
  { name: "/profile", category: "مستوى", desc: "عرض بروفايل العضو وخبرته" },
  { name: "/credits", category: "مستوى", desc: "عرض رصيد الكريدت" },
  { name: "/levels", category: "مستوى", desc: "لوحة ترتيب الخبرة" },
  { name: "/newticket", category: "تذاكر", desc: "فتح تذكرة دعم" },
  { name: "/deleteticket", category: "تذاكر", desc: "حذف تذكرة" },
  { name: "/tickets", category: "تذاكر", desc: "عرض جميع التذاكر" },
  { name: "/manageticket", category: "تذاكر", desc: "إدارة تذكرة" },
  { name: "/giveaway", category: "مسابقات", desc: "إنشاء مسابقة هدايا" },
  { name: "/poll", category: "استطلاعات", desc: "إنشاء استطلاع رأي" },
  { name: "/serverinfo", category: "معلومات", desc: "معلومات السيرفر" },
  { name: "/ask-ai", category: "ذكاء اصطناعي", desc: "اسأل الذكاء الاصطناعي سؤالاً" },
  { name: "/ai-chat", category: "ذكاء اصطناعي", desc: "محادثة مع الذكاء الاصطناعي" },
  { name: "/ping", category: "عام", desc: "قياس سرعة استجابة البوت" },
  { name: "/say", category: "عام", desc: "إرسال رسالة عبر البوت" },
];

const categories = [
  { name: "إشراف", icon: "🛡️", color: "#ed4245" },
  { name: "تحذيرات", icon: "⚠️", color: "#faa81a" },
  { name: "أدوار", icon: "🎭", color: "#9b59b6" },
  { name: "مستوى", icon: "⭐", color: "#f1c40f" },
  { name: "تذاكر", icon: "🎫", color: "#5865f2" },
  { name: "مسابقات", icon: "🎉", color: "#57f287" },
  { name: "استطلاعات", icon: "📊", color: "#00b0f4" },
  { name: "ذكاء اصطناعي", icon: "🤖", color: "#57f287" },
  { name: "معلومات", icon: "ℹ️", color: "#72767d" },
  { name: "عام", icon: "✨", color: "#dcddde" },
];

function getCategoryColor(cat) {
  return categories.find(c => c.name === cat)?.color ?? "#5865f2";
}
function getCategoryIcon(cat) {
  return categories.find(c => c.name === cat)?.icon ?? "🔧";
}

export default function Home() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#202225" }}>
      {/* Header */}
      <header style={{ backgroundColor: "#2f3136", borderBottom: "1px solid #40444b", padding: "0 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg, #5865f2, #9b59b6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🤖</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 18, color: "#fff" }}>بوت ابو داحم</div>
              <div style={{ fontSize: 12, color: "#57f287" }}>● متصل ويعمل</div>
            </div>
          </div>
          <div style={{ background: "rgba(88,101,242,0.15)", border: "1px solid rgba(88,101,242,0.3)", borderRadius: 20, padding: "4px 14px", fontSize: 13, color: "#5865f2", fontWeight: 600 }}>
            {commands.length} أمر
          </div>
        </div>
      </header>

      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #1e2124, #2f3136)", padding: "52px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🤖</div>
        <h1 style={{ fontSize: 42, fontWeight: 800, color: "#fff", marginBottom: 12 }}>بوت ابو داحم</h1>
        <p style={{ fontSize: 18, color: "#b9bbbe", maxWidth: 560, margin: "0 auto 32px" }}>
          بوت ديسكورد متكامل بـ {commands.length} أمر
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          {categories.map(cat => (
            <div key={cat.name} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 999, padding: "6px 16px", fontSize: 13, color: "#dcddde" }}>
              {cat.icon} {cat.name} <span style={{ color: cat.color, fontWeight: 700 }}>{commands.filter(c => c.category === cat.name).length}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Commands Grid */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 24 }}>جميع الأوامر</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
          {commands.map(cmd => (
            <div key={cmd.name} style={{ background: "#2f3136", border: "1px solid #40444b", borderRadius: 10, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ fontSize: 22 }}>{getCategoryIcon(cmd.category)}</div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                  <code style={{ fontSize: 14, fontWeight: 700, color: "#5865f2" }}>{cmd.name}</code>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 8px", borderRadius: 999, backgroundColor: getCategoryColor(cmd.category) + "22", color: getCategoryColor(cmd.category) }}>{cmd.category}</span>
                </div>
                <div style={{ fontSize: 13, color: "#b9bbbe" }}>{cmd.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <footer style={{ borderTop: "1px solid #40444b", backgroundColor: "#2f3136", padding: "20px", textAlign: "center" }}>
        <p style={{ color: "#72767d", fontSize: 13 }}>🤖 بوت ابو داحم — مبني بـ Discord.js وذكاء Gemini</p>
      </footer>
    </div>
  );
}
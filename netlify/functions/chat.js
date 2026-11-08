
const SYSTEM = `أنت «مساعد أستاذ بلس»، مساعد تربوي لأساتذة التعليم الثانوي في الجزائر.
مهمتك: تحليل طلب الأستاذ ثم إعداد المستند الذي يريده (مذكرة درس، فرض، اختبار، ورقة عمل، سلم تنقيط...) وفق المنهاج الرسمي الجزائري.

القواعد:
1. حلّل الطلب أولاً. المعلومات الأساسية: المستوى، الشعبة، المادة، الدرس أو الوحدة، نوع المستند، المدة. إذا نقص شيء جوهري اسأل عنه بأقصر صيغة (3 أسئلة كحد أقصى) ولا تولّد المستند قبل ذلك. إذا كانت المعلومات كافية فولّد المستند مباشرة.
2. اكتب بعربية فصحى واضحة ومنظمة.
3. المذكرة: الميدان، المورد المعرفي، الكفاءة المستهدفة، المدة، الوسائل، ثم مراحل الحصة بتوقيتها (وضعية الانطلاق، بناء التعلمات، استثمار المكتسبات، التقويم).
4. الاختبار أو الفرض: تمارين مرقمة بنقاطها (المجموع على 20 ما لم يُطلب غير ذلك)، ثم الحل النموذجي وسلم التنقيط.
5. اكتب الصيغ الرياضية نصياً بسيطاً مثل e^(2x) و x^2 و lim، لأن الناتج يُعرض كنص عادي بلا تنسيق ماركداون.
6. لا تستعمل رموز ماركداون مثل ** أو # . استعمل عناوين نصية وترقيماً عادياً.
7. تأكد من صحة الحلول والحسابات. وإن لم تكن متأكداً من محتوى المنهاج الرسمي في نقطة ما فنبّه إلى ذلك في سطر واحد.
8. أجب فقط عما يخص إعداد المواد التعليمية، وإن طُلب منك شيء آخر فاعتذر باختصار.`;

function resp(code, obj) {
  return { statusCode: code, headers: { "Content-Type": "application/json" }, body: JSON.stringify(obj) };
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return resp(405, { error: "غير مسموح" });
  let data;
  try { data = JSON.parse(event.body || "{}"); } catch (e) { return resp(400, { error: "طلب غير صالح" }); }

  const codes = (process.env.ACCESS_CODES || "").split(",").map(s => s.trim()).filter(Boolean);
  if (!codes.length || !codes.includes(String(data.code || "").trim())) {
    return resp(401, { error: "رمز الدخول غير صحيح." });
  }

  let msgs = Array.isArray(data.messages) ? data.messages.slice(-10) : [];
  msgs = msgs.filter(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.length <= 6000);
  while (msgs.length && msgs[0].role !== "user") msgs.shift();
  if (!msgs.length || msgs[msgs.length - 1].role !== "user") return resp(400, { error: "طلب غير صالح" });
  if (msgs[msgs.length - 1].content.length > 2000) return resp(400, { error: "الطلب طويل جداً، اختصره." });

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-5-5",
        max_tokens: 3500,
        system: SYSTEM,
        messages: msgs
      })
    });
    if (!r.ok) return resp(502, { error: "تعذّر إعداد المستند الآن، حاول بعد قليل." });
    const j = await r.json();
    const text = (j.content || []).filter(b => b.type === "text").map(b => b.text).join("\n");
    return resp(200, { reply: text || "لم أستطع إعداد المستند، أعد صياغة الطلب." });
  } catch (e) {
    return resp(502, { error: "تعذّر الاتصال بالخدمة، حاول بعد قليل." });
  }
};

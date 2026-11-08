exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const bodyData = JSON.parse(event.body || '{}');
    const message = bodyData.message || '';
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'مفتاح GEMINI_API_KEY غير موجود' })
      };
    }

    const apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: "أنت مساعد تربوي لأساتذة التعليم الثانوي في الجزائر. أجب على طلب الأستاذ التالي: " + message }]
        }]
      })
    });

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: data.error?.message || 'خطأ من خادم جوجل' })
      };
    }

    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'عذراً، لم أستطع توليد الإجابة.';

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply: replyText })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'حدث خطأ داخلي في الخادم' })
    };
  }
};

exports.handler = async function(event, context) {
  // التأكد من أن الطلب من نوع POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // استخراج الرسالة من جسم الطلب
    const { message } = JSON.parse(event.body);
    
    // استدعاء المفتاح السري الذي أضفته في إعدادات Netlify
    const apiKey = process.env.ANTHROPIC_API_KEY;

    // إرسال الطلب إلى خوادم Anthropic
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307', // يمكنك تغييره إلى sonnet إذا أردت
        max_tokens: 1024,
        messages: [{ role: 'user', content: message }]
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API Error: ${response.status}`);
    }

    const data = await response.json();

    // إعادة رد الذكاء الاصطناعي إلى واجهتك الأمامية
    return {
      statusCode: 200,
      body: JSON.stringify({ reply: data.content[0].text })
    };

  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'حدث خطأ أثناء معالجة الطلب' })
    };
  }
};

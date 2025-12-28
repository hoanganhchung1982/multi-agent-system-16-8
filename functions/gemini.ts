// --- File: functions/gemini.ts ---

export const onRequestPost: PagesFunction<{ GEMINI_API_KEY: string }> = async (context) => {
  try {
    const { request, env } = context;

    // 1. Lấy API Key từ biến môi trường của Cloudflare
    const apiKey = env.GEMINI_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Thiếu Gemini API Key trên Cloudflare' }), { status: 500 });
    }

    const { subject, prompt, image } = await request.json() as any;

    // 2. Cấu trúc dữ liệu gửi sang Gemini
    const contents = [
      {
        parts: [
          { text: `Bạn là giáo viên chuyên nghiệp. Trả về JSON chính xác cấu trúc này: { "speed": { "answer": "đáp án", "similar": { "question": "câu hỏi", "options": ["A", "B", "C", "D"], "correctIndex": 0 } }, "socratic_hint": "gợi ý", "core_concept": "khái niệm" }. Môn ${subject}: ${prompt}` },
          ...(image ? [{
            inlineData: {
              mimeType: "image/jpeg",
              data: image.includes(",") ? image.split(",")[1] : image
            }
          }] : [])
        ]
      }
    ];

    // 3. Gọi Gemini API (Sử dụng gemini-1.5-flash-latest để ổn định nhất)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1
        }
      })
    });

    const data: any = await response.json();

    if (!data.candidates || !data.candidates[0]) {
      return new Response(JSON.stringify({ error: 'AI không phản hồi' }), { status: 500 });
    }

    const content = data.candidates[0].content.parts[0].text;
    
    return new Response(content, {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: 'Lỗi máy chủ Cloudflare: ' + err.message }), { status: 500 });
  }
};

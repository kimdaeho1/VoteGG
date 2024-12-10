const express = require('express');
const router = express.Router();
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.WHISPER_API_KEY
});

router.post('/api/summarize', async (req, res) => {
  const { transcripts } = req.body;
  
  // 대화 내용을 하나의 텍스트로 변환
  const conversationText = transcripts
    .map(t => `${t.speaker}: ${t.text}`)
    .join('\n');
    
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "토론의 내용을 분석하여 각 참가자의 주요 주장과 논리를 3문장 이내로 간단히 요약해주고, 요약문은 주요 주장과 근거의 1, 2, 3번으로 구성하여 출력해줘"
        },
        {
          role: "user",
          content: conversationText
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    res.json({
      summary: completion.choices[0].message.content
    });
    
  } catch (error) {
    console.error('OpenAI API error:', error);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

module.exports = router;
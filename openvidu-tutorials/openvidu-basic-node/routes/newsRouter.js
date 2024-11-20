const axios = require('axios');
const cheerio = require('cheerio');
const iconv = require('iconv-lite');
const express = require('express');
const router = express.Router();

router.get('/policy-news', async (req, res) => {
  console.log("Request received at /policy-news");

  try {
    const { data: response } = await axios.get('https://www.korea.kr/news/policyNewsList.do', {
      responseType: 'arraybuffer',
    });

    const data = iconv.decode(Buffer.from(response), 'utf-8');
    const $ = cheerio.load(data);

    const newsList = [];

    // ul.lst.num 내의 모든 li 요소를 순회
    $('ul.lst.num li').each((index, element) => {
      if (index < 5) { // 상위 5개 뉴스만 가져옵니다.
        const title = $(element).find('.text span').text().trim();
        const rawLink = $(element).find('a').attr('href');
        const link = rawLink ? `https://www.korea.kr${rawLink}` : null;

        // 제목과 링크가 유효한지 확인하기 위해 로그 추가
        console.log(`Title found: ${title}`);
        console.log(`Link found: ${link}`);

        if (title && link) {
          newsList.push({ title, link });
        }
      }
    });

    if (newsList.length === 0) {
      console.warn('No news items found on the page. Please check the structure or network.');
      return res.status(404).json({ error: 'No news items found' });
    }

    console.log("Fetched newsList:", newsList);
    res.json(newsList);
  } catch (error) {
    console.error('크롤링 중 오류 발생:', error);
    res.status(500).json({ error: 'Failed to fetch policy news' });
  }
});

module.exports = router;
const axios = require('axios');
const cheerio = require('cheerio');
const iconv = require('iconv-lite');
const express = require('express');
const router = express.Router();

// 정책 기사 크롤링 API
router.get('/policy-news', async (req, res) => {
  // console.log("Request received at /policy-news");

  try {
    const { data: response } = await axios.get('https://www.korea.kr/news/policyNewsList.do', {
      responseType: 'arraybuffer',
    });

    const data = iconv.decode(Buffer.from(response), 'utf-8');
    const $ = cheerio.load(data);

    const newsList = [];

    // 정책 기사 목록에서 데이터 추출
    $('ul.lst.num li').each((index, element) => {
      if (index < 5) { // 상위 5개 기사만 추출
        const title = $(element).find('.text span').text().trim();
        const rawLink = $(element).find('a').attr('href');
        const link = rawLink ? `https://www.korea.kr${rawLink}` : null;

        if (title && link) {
          newsList.push({ title, link });
        }
      }
    });

    // 디버깅 메시지 출력
    // console.log("Crawled policy news:", newsList);

    if (newsList.length === 0) {
      return res.status(404).json({ error: 'No news items found' });
    }

    res.json(newsList); // 정책 기사 목록 반환
  } catch (error) {
    // console.error('크롤링 중 오류 발생:', error);
    res.status(500).json({ error: 'Failed to fetch policy news' });
  }
});

// 게임 랭킹 크롤링 API
router.get('/game-rankings', async (req, res) => {
  // console.log("Request received at /game-rankings");

  try {
    const { data: response } = await axios.get('https://www.gamemeca.com/ranking.php', {
      responseType: 'arraybuffer',
    });

    const data = iconv.decode(Buffer.from(response), 'utf-8');
    const $ = cheerio.load(data);

    const gameList = [];

    // 게임 제목과 링크 추출
    $('div.game-name a').each((index, element) => {
      if (index < 5) { // 상위 5개 게임만 추출
        const title = $(element).text().trim(); // 게임 이름
        const link = $(element).attr('href'); // 하이퍼링크

        if (title && link) {
          const fullLink = `https://www.gamemeca.com${link}`; // 전체 링크 형성
          gameList.push({ title, link: fullLink });
        }
      }
    });

    // 디버깅 메시지 출력
    // console.log("Crawled game rankings:", gameList);

    if (gameList.length === 0) {
      return res.status(404).json({ error: 'No game rankings found' });
    }

    res.json(gameList); // 게임 랭킹 목록 반환
  } catch (error) {
    // console.error('크롤링 중 오류 발생:', error);
    res.status(500).json({ error: 'Failed to fetch game rankings' });
  }
});

// 빌보드 차트 크롤링 API
router.get('/billboard-chart', async (req, res) => {
  // console.log("Request received at /billboard-chart");

  try {
    // Billboard Hot 100 페이지에서 데이터 요청
    const { data: response } = await axios.get('https://www.billboard.com/charts/hot-100/');

    // HTML을 cheerio로 파싱
    const $ = cheerio.load(response);

    const chartList = [];

    // o-chart-results-list-row-container 안의 각 항목을 순회하면서 제목을 추출
    $('div.o-chart-results-list-row-container').each((index, element) => {
      if (index < 5) { // 상위 5개 차트만 추출
        const title = $(element).find('h3#title-of-a-story').text().trim(); // 제목만 추출

        // 불필요한 텍스트 제거 (Songwriter, Producer, Imprint 등)
        const cleanedTitle = title.replace(/(Songwriter\(s\):|Producer\(s\):|Imprint\/Promotion Label:)/g, '').trim();

        if (cleanedTitle) {
          chartList.push({ title: cleanedTitle, link: "" }); // 링크는 빈 문자열로 설정
        }
      }
    });

    // 디버깅: 크롤링된 차트 데이터 콘솔 로그로 출력
    // console.log("Crawled Billboard chart (Top 5):", chartList);

    // 크롤링된 차트 데이터 응답
    if (chartList.length === 0) {
      return res.status(404).json({ error: 'No chart items found' });
    }

    res.json(chartList); // 응답으로 크롤링된 차트 목록 전달
  } catch (error) {
    // console.error('크롤링 중 오류 발생:', error);
    res.status(500).json({ error: 'Failed to fetch billboard chart' });
  }
});


// CGV 영화 목록 크롤링 API
router.get('/cgv-movies', async (req, res) => {
  // console.log("Request received at /api/news/cgv-movies");

  try {
    const { data: response } = await axios.get('http://www.cgv.co.kr/movies/?lt=1&ft=0');
    const $ = cheerio.load(response);
    const movieList = [];

    // 첫 번째 ol 안에 있는 li 3개 가져오기
    $('ol').first().find('li').each((index, element) => {
      if (index < 3) { // 첫 번째 ol에서 3개 항목만 가져오기
        const title = $(element).find('a strong').text().trim(); // 영화 제목
        const link = $(element).find('a').attr('href'); // 링크 추출
        // console.log(`Title: ${title}, Link: ${link}`);  // 디버그 로그
        if (title && link) {
          const fullLink = `http://www.cgv.co.kr${link}`; // 전체 링크
          movieList.push({ title, link: fullLink });
        }
      }
    });

    // 두 번째 ol 안에 있는 li 2개 가져오기
    $('ol').eq(1).find('li').each((index, element) => {
      if (index < 2) { // 두 번째 ol에서 2개 항목만 가져오기
        const title = $(element).find('a strong').text().trim(); // 영화 제목
        const link = $(element).find('a').attr('href'); // 링크 추출
        // console.log(`Title: ${title}, Link: ${link}`);  // 디버그 로그
        if (title && link) {
          const fullLink = `http://www.cgv.co.kr${link}`; // 전체 링크
          movieList.push({ title, link: fullLink });
        }
      }
    });

    // 크롤링된 영화 목록 반환
    if (movieList.length === 0) {
      return res.status(404).json({ error: 'No movie titles found' });
    }

    // console.log("Crawled Movie List (Top 5):", movieList);  // 크롤된 영화 리스트 로그

    res.json(movieList); // 응답으로 크롤링된 영화 목록 반환
  } catch (error) {
    // console.error('크롤링 중 오류 발생:', error);
    res.status(500).json({ error: 'Failed to fetch movie data' });
  }
});


module.exports = router;


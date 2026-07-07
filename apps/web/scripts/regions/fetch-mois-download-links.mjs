import https from "node:https";

const url =
  "https://www.mois.go.kr/frt/bbs/type001/commonSelectBoardArticle.do?bbsId=BBSMSTR_000000000052&nttId=127039";

https
  .get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
    let data = "";
    res.on("data", (c) => {
      data += c;
    });
    res.on("end", () => {
      const matches = [...data.matchAll(/commonDownload\.do\?[^"'<>]+/g)];
      console.log(`found ${matches.length} download links`);
      for (const m of matches) {
        console.log(`https://www.mois.go.kr/frt/bbs/type001/${m[0]}`);
      }
    });
  })
  .on("error", (e) => {
    console.error(e.message);
    process.exit(1);
  });

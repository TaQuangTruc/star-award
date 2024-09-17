const puppeteer = require("puppeteer");

const { delay, readFile, readJsonFile, log } = require("./helper");

const BASED = 500;
const indexFile = 3; // Chỉnh ở đây

// Read the student and question bank files
const accounts = readFile(`output/account_${indexFile}.txt`);
const questionBank = readJsonFile("bankQuestion/questionBank.txt");

const notFound = readFile(`not_found.log`);
const participatedAccount = readFile(`participated.log`);
const success = readFile(`success.log`);

(async () => {
  let index = 0;
  let count = 1;

  while (index < accounts.length) {
    const account = accounts[index];

    const password = "QWE123$%^";

    let page;
    let browser; // Khởi tạo lại trình duyệt mỗi lần có lỗi

    if (index == 0) {
      console.log(`Bắt đầu thi ${accounts.length} tài khoản`);
    }

    try {
      if (
        notFound
          .concat(participatedAccount)
          .concat(success)
          .find((x) => account == x)
      )
        continue;
      // Khởi tạo trình duyệt mới mỗi lần thi
      browser = await puppeteer.launch();
      page = await browser.newPage();

      console.log(
        ` *** Bắt đầu lượt thi thứ ${index + 1}. Sinh viên thực hiện ${account}`
      );

      // Đợi trang login tải xong
      await page.goto("https://starawards.vn/login", {
        waitUntil: "networkidle0",
      });

      // Đợi và nhập tài khoản
      await page.waitForSelector('input[name="email"]', { visible: true });
      await Promise.all([
        page.type('input[name="email"]', account),
        delay(BASED * 3),
      ]);

      // Đợi và nhập mật khẩu
      await page.waitForSelector('input[name="password"]', { visible: true });
      await Promise.all([
        page.type('input[name="password"]', password),
        delay(BASED * 3),
      ]);

      // Đợi và nhấn nút login
      await page.waitForSelector("#loginBtnSubmit", { visible: true });
      await Promise.all([
        page.click("#loginBtnSubmit"),
        page.waitForNavigation(),
      ]);
      // await page.screenshot({ fullPage: true, path: "page.png" });

      const loginFailed = await page.$("div.alert-danger.text-red-600");

      if (loginFailed) {
        log("not_found.log", account);
        continue;
      }

      await page.goto("https://starawards.vn/profile", {
        waitUntil: "networkidle0",
      });

      const participated = await page.$("table tbody tr");
      if (participated) {
        log("participated.log", account);
        continue;
      }

      await page.goto("https://starawards.vn/test", {
        waitUntil: "networkidle0",
      });
      // Đợi và nhấn nút "Show Mock Test"
      await page.waitForSelector(".btnShowMockMultipleTest", { visible: true });
      await Promise.all([
        page.click(".btnShowMockMultipleTest"),
        delay(BASED * 3),
      ]);

      // Bắt đầu vòng lặp câu hỏi
      for (let i = 1; i <= 40; i++) {
        const questionSelector = `#laraQuestionItem-${i} .laraQuestion p`;

        // Đợi câu hỏi xuất hiện
        await page.waitForSelector(questionSelector, { visible: true });
        const questionElement = await page.$(questionSelector);

        if (questionElement) {
          const questionText = await page.evaluate(
            (el) => el.textContent,
            questionElement
          );

          let foundInBank = false;

          for (const bankQuestion of questionBank) {
            if (questionText.includes(bankQuestion.question)) {
              foundInBank = true;

              // Đợi các lựa chọn câu trả lời xuất hiện
              const answerChoices = await page.$$(
                `#laraQuestionItem-${i} .formRadioAnswers label`
              );

              // Chọn câu trả lời đúng
              for (const answerChoice of answerChoices) {
                const answerText = await page.evaluate(
                  (el) => el.textContent.trim(),
                  answerChoice
                );
                if (answerText === bankQuestion.answer) {
                  await answerChoice.click();
                  break;
                }
              }
              break;
            }
          }

          // Nếu câu hỏi không có trong ngân hàng câu hỏi, lưu lại
          if (!foundInBank) {
            const newQuestion = {
              question: questionText,
              answers: await page.$$eval(
                `#laraQuestionItem-${i} .formRadioAnswers label p`,
                (elements) => elements.map((el) => el.textContent.trim())
              ),
            };
            const newData = JSON.stringify(newQuestion, null, 2);
          }
        }

        // Chuyển đến câu hỏi tiếp theo hoặc nộp bài
        if (i == 40) {
          // Đợi nút nộp bài xuất hiện và click
          await page.waitForSelector('a[href="#modalSubmitExam"]', {
            visible: true,
          });
          await page.click('a[href="#modalSubmitExam"]');
          await delay(BASED * 3);

          // Đợi và xác nhận nộp bài
          const confirmSubmit = "#testFormBtn";
          await page.waitForSelector(confirmSubmit, { visible: true });
          await page.click(confirmSubmit);
          log("success.log", account);
          console.log(`${account} đã nộp bài`);
        } else {
          // Chuyển đến câu hỏi tiếp theo
          const laraNextQuestionItemDot = `#laraQuestionItemDot-${i + 1}`; // chọn chính div chứa icon
          await page.waitForSelector(laraNextQuestionItemDot, {
            visible: true,
          });
          await page.click(laraNextQuestionItemDot);
        }
      }

      // Đợi trang login để đăng xuất
      await page.goto("https://starawards.vn/login", {
        waitUntil: "networkidle0",
      });

      // Đợi nút đăng xuất xuất hiện và click
      await page.waitForSelector("a.laraLogout", { visible: true });
      await page.click("a.laraLogout");

      console.log(`Số sinh viên đã thực hiện thi thành công: ${count}`);
      count++;
    } catch (error) {
      console.log(`Xảy ra lỗi trong quá trình thi của sinh viên ${account}`);
      log("failure", account);
      console.log(error);
    } finally {
      index++;
      if (page) {
        await page.close();
      }
      if (browser) {
        await browser.close(); // Đóng trình duyệt sau mỗi vòng lặp
      }
    }
  }

  console.log("*** ĐÃ HOÀN TẤT ****");
})();
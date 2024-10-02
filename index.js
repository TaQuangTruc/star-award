const puppeteer = require("puppeteer");
const {
  delay,
  getGraduationYear,
  log,
  getRandomName,
  getRandomEmailFromName,
  getRandomPhoneNumber,
  getRandomMajorAndCareer,
  getRandomStudentId,
  getRandomBirthday,
  readJsonFile,
  getRandomInt,
} = require("./helper");

const numberAccount = Number(process.argv[2]);

const BASED = 500;
const questionBank = readJsonFile("bankQuestion/questionBank.txt");

const register = async (page, student) => {
  try {
    console.log(`Bắt đầu đăng ký: ${student.studentId} - ${student.email}`);

    await page.goto("https://starawards.vn/register", {
      waitUntil: "networkidle0",
    });

    await page.waitForSelector('input[name="fullName"]');
    await page.type('input[name="fullName"]', student.name);

    await page.waitForSelector('select[name="clusterId"]');
    await Promise.all([
      page.select('select[name="clusterId"]', "15"),
      delay(BASED),
    ]);

    await page.waitForSelector('select[name="universityId"]');
    await Promise.all([
      page.select('select[name="universityId"]', "638"),
      delay(BASED),
    ]);

    await page.waitForSelector('input[name="major"]');
    await page.type('input[name="major"]', student.major.major);

    await page.waitForSelector('select[name="graduationYear"]');
    await page.select(
      'select[name="graduationYear"]',
      `${student.graduationYear}`
    );

    await page.waitForSelector('select[name="desiredCareer"]');
    await page.select(
      'select[name="desiredCareer"]',
      `${student.major.career}`
    );

    await page.waitForSelector('input[name="studentId"]');
    await page.type('input[name="studentId"]', student.studentId);

    await page.waitForSelector('input[name="birth"]');
    await page.type('input[name="birth"]', student.birthday);

    await page.waitForSelector('input[name="phoneNumber"]');
    await page.type('input[name="phoneNumber"]', student.phoneNumber);

    await page.waitForSelector('input[name="email"]');
    await page.type('input[name="email"]', student.email);

    await page.waitForSelector('input[name="password"]');
    await page.type('input[name="password"]', student.password);

    await page.waitForSelector('input[name="passwordConfirm"]');
    await page.type('input[name="passwordConfirm"]', student.password);

    await page.waitForSelector("#agreeTerms");
    await Promise.all([await page.click("#agreeTerms"), delay(BASED)]);

    await page.waitForSelector("#shRegisterBtn");
    await page.click("#shRegisterBtn");

    log("student.txt", `${student.studentId} - ${student.email}`);
    console.log(`Đăng ký thành công: ${student.studentId} - ${student.email}`);
  } catch (error) {
    console.log(`Lỗi khi đăng ký: ${student.studentId} - ${student.email}`);
    throw error;
  } finally {
    console.log(`Kết thúc đăng ký: ${student.studentId} - ${student.email}`);
  }
};

const test = async (page, student) => {
  try {
    console.log(`Bắt đầu thi: ${student.studentId} - ${student.email}`);

    await delay(BASED * 5);
    await Promise.all([
      await page.click(".btnShowMockMultipleTest"),
      delay(BASED * 3),
    ]);

    for (let i = 1; i <= 40; i++) {
      const questionSelector = `#laraQuestionItem-${i} .laraQuestion p`;
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

            // Iterate over answer choices to find the correct answer
            const answerChoices = await page.$$(
              `#laraQuestionItem-${i} .formRadioAnswers label`
            );
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

        // If the question is not in the question bank, add it to the new questions array
        if (!foundInBank) {
          const newQuestion = {
            question: questionText,
            answers: await page.$$eval(
              `#laraQuestionItem-${i} .formRadioAnswers label p`,
              (elements) => elements.map((el) => el.textContent.trim())
            ),
          };
          const newData = JSON.stringify(newQuestion, null, 2);
          log("newQuestion.txt", newData);
        }
      }

      // Click the button to proceed to the next question
      if (i == 40) {
        const submitButtonSelector = 'a[href="#modalSubmitExam"]';
        await page.waitForSelector(submitButtonSelector);
        await page.click(submitButtonSelector);
        delay(BASED * 3);

        const confirmSubmit = "#testFormBtn";
        await page.waitForSelector(confirmSubmit, { visible: true });
        await page.click(confirmSubmit);
        console.log(`Hoàn thành thi: ${student.studentId} - ${student.email}`);
      } else {
        const laraNextQuestionItemDot = `#laraQuestionItemDot-${i + 1}`; // chọn chính div chứa icon
        await page.waitForSelector(laraNextQuestionItemDot);
        await page.click(laraNextQuestionItemDot);
      }

      await delay(BASED * getRandomInt(7, 13));
    }

    log("success.txt", student.email);
  } catch (error) {
    console.log(`Lỗi khi thi: ${student.name} - ${student.studentId}`);
    log("error.txt", student.email);
  } finally {
    console.log(`Kết thúc thi: ${student.studentId} - ${student.email}`);
  }
};

const generateStudentData = async () => {
  const name = getRandomName();
  const email = getRandomEmailFromName(name);
  const phoneNumber = getRandomPhoneNumber();
  const major = getRandomMajorAndCareer();
  const studentId = getRandomStudentId();
  const birthday = getRandomBirthday(studentId);
  const graduationYear = getGraduationYear(studentId);
  const password = "QWE123$%^";

  return {
    name,
    email,
    phoneNumber,
    major,
    studentId,
    birthday,
    graduationYear,
    password,
  };
};

(async () => {
  let browser;
  let page;

  let index = 1;

  while (index <= numberAccount) {
    browser = await puppeteer.launch();
    page = await browser.newPage();

    try {
      console.log(`*** Bắt đầu lần thứ ${index}/${numberAccount}`);

      const student = await generateStudentData();
      await register(page, student);
      await test(page, student);
    } catch (error) {
      continue;
    } finally {
      index++;
      if (page) {
        await page.close();
      }
      if (browser) {
        await browser.close();
      }
    }
  }
  console.log("*** ĐÃ HOÀN TẤT QUÁ TRÌNH ****");
})();

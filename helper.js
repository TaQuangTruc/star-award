const fs = require("fs");
const htmlParser = require("node-html-parser");
const slugify = require("slugify");
const xlsx = require('xlsx');

// Hàm đọc file JSON
function readJsonFile(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data); // Chuyển chuỗi JSON thành object và trả về
  } catch (err) {
    console.error('Error reading or parsing the file:', err);
    return [];
  }
}

function excelToArray(filePath) {
  // Đọc file Excel
  const workbook = xlsx.readFile(filePath);

  // Lấy danh sách các sheet có trong file
  const sheetNames = workbook.SheetNames;
  
  // Chọn sheet đầu tiên
  const firstSheet = workbook.Sheets[sheetNames[0]];
  
  // Chuyển đổi sheet thành dữ liệu JSON
  const data = xlsx.utils.sheet_to_json(firstSheet);

  return data;
}



function delay(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
}

function getLink(text) {
  const root = htmlParser.parse(text);
  return root.querySelector("a").getAttribute("href");
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomName() {
  const ho = readFile("randomDB/ho.txt");
  const ten = readFile("randomDB/ten.txt");

  const indexHo = getRandomInt(0, 99);
  const indexTen = getRandomInt(0, 199);

  return indexTen > 99
    ? `${ho[indexHo]} Thị ${ten[indexTen]}`
    : `${ho[indexHo]} Văn ${ten[indexTen]}`;
}

function getRandomEmailFromName(name) {
  return (
    slugify(name.toLowerCase(), "") +
    getRandomInt(0, 9999) +
    "@tuoitrebachkhoa.edu.vn"
  );
}

function getRandomPhoneNumber() {
  const prefixs = readFile("randomDB/dienthoai.txt");
  const index = getRandomInt(0, prefixs.length - 1);
  
  const prefix = prefixs[index];
  const postfix = getRandomInt(0, 9999999);
  
  const formattedPostfix = postfix.toString().padStart(7, '0');
  
  const phoneNumber = `${prefix}${formattedPostfix}`;
  
  return phoneNumber;
}

function getRandomBirthday(studentId) {
  const khoaHoc = studentId.substr(0, 2);
  const year = Number(khoaHoc) - 18 + 2000;
  const day = getRandomInt(1, 31);
  const month = getRandomInt(1, 12);

  return `${day}/${month}/${year}`;
}

function getRandomMajorAndCareer() {
  const majors = readFile("randomDB/nganh.txt")
  const index = getRandomInt(0, majors.length - 1);

  return {
    major: majors[index],
    career: (index == 0 || index == 1) ? "it" : "others"
  };
}

function getRandomStudentId() {
  const prefixs = readFile("randomDB/mssv.txt");
  const index = getRandomInt(0, prefixs.length - 1);

  const prefix = prefixs[index];
  const postfix = getRandomInt(1, 9000);
  const formattedPostfix = postfix.toString().padStart(4, '0');

  const mssv = `${prefix}${formattedPostfix}`
  return mssv;
}

function getGraduationYear(studentId) {
  const year = studentId.substr(0, 2);
  return Number(year) + 2004;
}

function log(filePath, message) {
  fs.appendFileSync(filePath, message + "\n");
}

function logError(message) {
  fs.appendFileSync(`${__dirname}/error.txt`, message + "\n");
}

function readFile(filePath) {
  try {
      // Đọc nội dung file
      const data = fs.readFileSync(filePath, 'utf8');
      // Tách nội dung thành mảng và loại bỏ các dòng trống
      const results = data.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      return results;
  } catch (err) {
      console.error("Lỗi khi đọc file:", err);
      return [];
  }
}

function appendFile(filepath, content) {
  const dataToWrite = JSON.stringify(content, null, 2);
  fs.writeFileSync(filepath, dataToWrite, "utf8");
}

function checkFileExistsAndCreate(filepath) {
  if (!fs.existsSync(filepath)) fs.appendFileSync(filepath, "");
}


module.exports = {
  delay,
  getLink,
  logError,
  log,
  readFile,
  checkFileExistsAndCreate,
  appendFile,
  readJsonFile,
  getRandomName,
  getRandomEmailFromName,
  getRandomPhoneNumber,
  getRandomMajorAndCareer,
  getRandomStudentId,
  getGraduationYear,
  getRandomBirthday,
  excelToArray
};

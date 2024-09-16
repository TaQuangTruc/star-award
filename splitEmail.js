const fs = require('fs');
const path = require('path');

// Đọc nội dung từ file chứa danh sách email
const inputFile = path.join(__dirname, 'emails.txt');
const outputFolder = path.join(__dirname, 'output');

// Đảm bảo thư mục output tồn tại, nếu không thì tạo mới
if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder);
}

// Hàm để chia nội dung thành các file nhỏ
const splitFile = (data, linesPerFile) => {
    const lines = data.split('\n');
    let fileCount = 0;

    for (let i = 0; i < lines.length; i += linesPerFile) {
        fileCount++;
        const chunk = lines.slice(i, i + linesPerFile).join('\n');
        const outputFile = path.join(outputFolder, `emails_part_${fileCount}.txt`);
        
        // Ghi nội dung vào file mới
        fs.writeFileSync(outputFile, chunk);
        console.log(`Đã ghi file: ${outputFile}`);
    }
};

// Đọc file và xử lý
fs.readFile(inputFile, 'utf8', (err, data) => {
    if (err) {
        console.error('Lỗi khi đọc file:', err);
        return;
    }

    // Gọi hàm chia file, mỗi file chứa 1000 dòng
    splitFile(data, 1000);
});

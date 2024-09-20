const fs = require('fs');
const path = require('path');

// Định nghĩa các đường dẫn
const outputFolder = path.join(__dirname, 'output');
const mergedFile = path.join(__dirname, 'merged_accounts.txt');

// Đảm bảo thư mục output tồn tại
if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder);
}

// Hàm gộp các file nhỏ lại thành một file duy nhất
const mergeFiles = (folderPath, outputFile) => {
    fs.readdir(folderPath, (err, files) => {
        if (err) {
            console.error('Lỗi khi đọc thư mục:', err);
            return;
        }

        const writeStream = fs.createWriteStream(outputFile);

        // Lọc và sắp xếp các file cần gộp
        files.filter(file => file.startsWith('account_') && file.endsWith('.txt'))
             .sort()
             .forEach(file => {
                const filePath = path.join(folderPath, file);
                const readStream = fs.createReadStream(filePath);
                
                readStream.pipe(writeStream);
                readStream.on('end', () => console.log(`Đã gộp file: ${file}`));
            });

        writeStream.on('finish', () => {
            console.log(`Đã gộp tất cả các file vào: ${outputFile}`);
            // Sau khi gộp xong, chia file gộp thành các phần nhỏ
            splitFile(outputFile);
        });
    });
};

// Hàm chia file thành các phần nhỏ và ghi đè lên các file cũ
const splitFile = (dataFile) => {
    fs.readFile(dataFile, 'utf8', (err, data) => {
        if (err) {
            console.error('Lỗi khi đọc file:', err);
            return;
        }

        const lines = data.split('\n');
        const uniqueLines = new Set();  // Set để lưu các dòng duy nhất
        const filteredLines = lines.filter(line => {
            if (!uniqueLines.has(line)) {
                uniqueLines.add(line);
                return true; // Giữ lại dòng nếu nó chưa xuất hiện
            }
            return false; // Bỏ qua dòng nếu nó đã xuất hiện
        });

        const linesPerFile = 1000;
        let fileCount = 0;
        let fileIndex = 1;

        for (let i = 0; i < filteredLines.length; i += linesPerFile) {
            fileCount++;
            const chunk = filteredLines.slice(i, i + linesPerFile).join('\n');
            const outputFile = path.join(outputFolder, `account_${fileIndex}.txt`);

            // Ghi đè lên file cũ
            fs.writeFileSync(outputFile, chunk);
            console.log(`Đã ghi file: ${outputFile}`);

            if (fileIndex < 7) {
                fileIndex++;
            }
        }

        // Xóa các file thừa nếu có
        for (let i = fileIndex; i <= 7; i++) {
            const fileToDelete = path.join(outputFolder, `account_${i}.txt`);
            if (fs.existsSync(fileToDelete)) {
                fs.unlinkSync(fileToDelete);
                console.log(`Đã xóa file thừa: ${fileToDelete}`);
            }
        }
    });
};

// Gộp các file account_1 đến account_7
mergeFiles(outputFolder, mergedFile);

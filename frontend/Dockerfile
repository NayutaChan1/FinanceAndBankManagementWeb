# ini penting buat bisa jalanin npm install dan npm run di containernya dan memulai tahap build
FROM node:22-alpine as build

# menginisialisasi directory /app di dalam container
WORKDIR /app
# menyalin package-lock.json dan package.json ke dalam containernya (./)
COPY package*.json ./
# dari packagwe yang udah di salin kita jalankan npm install (npm bis adijalankan karena kita memakai base imagenya node.js (node))
RUN npm install
# menyalin sisa kodenya, dipisah dengan menyalin package karena ada yang namanya layer caching (kalo misal gaada perubahan di pacakagenya maka yang disalin ulang hanya kode utama anda dan tidak menyalin ulang kembali packagenya)
COPY . .
# npm run build buat membuat folder dist ( folder dist ini adalah hasil jadi dari codingan web kita yang bisa dibaca oleh browser)
RUN npm run build

# sekarang ngebuang image node sebelumnya dan ngegantinya jadi nginx (switch dari tahap build ke tahap prodcution)
FROM nginx:alpine
# menyalin hasil jadinya (dist) ke default root nginx agar bisa menyajikan htmlnya
COPY --from=build /app/dist /usr/share/nginx/html
# si expose ke port 80
EXPOSE 80
# CMD itu default command untuk memberi perintah ke container (nginx itu untuk jalanin nginx itu sendiri, -g itu buat ngeliat instruksi selanjutnya, daemonoff itu instruksi selnajutnya yang berfungsi untuk memastikan nginx setelah jalan tidak bersembunyi di background (agar kita bisa pake terminalnya lagi), namun memastikan nginx ini tetap jalan di foreground agar docker melihatnya tugasny masih berjalan sampai kita mematikannya)
CMD ["nginx", "-g", "daemon off;"]


# docker build -t finexcel .
# docker run -d -p 8080:80 finexcel
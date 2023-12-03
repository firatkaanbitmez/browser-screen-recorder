// JavaScript kodları buraya yazılabilir
let video = document.getElementById("video"); // Video elementini seç
let startButton = document.getElementById("start-button"); // Başlat butonunu seç
let stopButton = document.getElementById("stop-button"); // Durdur butonunu seç
let downloadLinks = document.getElementById("downloadLinks"); // İndirme bağlantılarını seç

let mediaRecorder; // MediaRecorder nesnesi
let recordedChunks = []; // Kaydedilen video parçaları
let audioContext; // AudioContext nesnesi
let audioSource; // AudioSource nesnesi
let audioRecorder; // Recorder nesnesi
let recordedAudio; // Kaydedilen ses verisi
downloadLinks.style.display = "none"; // Download linklerini görünür yap

video.volume = 0;

// Başlat butonuna tıklandığında
startButton.onclick = function () {
  // Kullanıcıdan ekran erişimi iste
  navigator.mediaDevices
    .getDisplayMedia({ video: true, audio: true })
    .then(function (stream) {
      // Ekran paylaşımı akışını video elementine bağla
      video.srcObject = stream;

      // MediaRecorder nesnesini oluştur
      mediaRecorder = new MediaRecorder(stream);

      // MediaRecorder nesnesinin dataavailable olayına bir fonksiyon ata
      mediaRecorder.ondataavailable = function (e) {
        // Eğer veri varsa, kaydedilen parçalara ekle
        if (e.data.size > 0) {
          recordedChunks.push(e.data);
        }
      };
      startButton.disabled = true;
      stopButton.disabled = false;
      // MediaRecorder nesnesinin stop olayına bir fonksiyon ata
      mediaRecorder.onstop = function () {
        // Kaydedilen parçaları birleştirerek Blob nesnesi oluştur
        let blob = new Blob(recordedChunks, {
          type: "video/webm",
        });

        // Blob nesnesini bir URL'ye dönüştür
        let url = URL.createObjectURL(blob);

        // URL'yi indirme bağlantısı olarak ekle
        let a = document.createElement("a");
        a.href = url;
        a.download = "video.webm";
        a.textContent = "Video dosyasını indir";
        downloadLinks.appendChild(a);
      };

      // MediaRecorder nesnesini başlat
      mediaRecorder.start();

      // AudioContext nesnesini oluştur
      audioContext = new AudioContext();

      // AudioSource nesnesini oluştur
      audioSource = audioContext.createMediaStreamSource(stream);

      // Recorder nesnesini oluştur
      audioRecorder = new Recorder(audioSource);

      // Recorder nesnesini başlat
      audioRecorder.record();
      removeDownloadLinks();
      // Başlat butonunu devre dışı bırak, durdur butonunu etkinleştir
    })
    .catch(function (error) {
      // Eğer hata olursa, konsola yaz
      console.error(error);
    });
};

// Durdur butonuna tıklandığında
stopButton.onclick = function () {
  // MediaRecorder nesnesini durdur
  mediaRecorder.stop();

  // Recorder nesnesini durdur ve kaydedilen ses verisini al
  audioRecorder.stop();
  audioRecorder.exportWAV(function (blob) {
    // Blob nesnesini bir URL'ye dönüştür
    let url = URL.createObjectURL(blob);

    // URL'yi indirme bağlantısı olarak ekle
    let a = document.createElement("a");
    a.href = url;
    a.download = "audio.wav";
    a.textContent = "Ses dosyasını indir";
    downloadLinks.appendChild(a);

    compressAudio(blob);
  });

  // Ekran paylaşımı akışını sonlandır
  video.srcObject.getTracks().forEach(function (track) {
    track.stop();
  });

  // Video elementinin kaynağını boşalt
  video.srcObject = null;

  // Durdur butonunu devre dışı bırak, başlat butonunu etkinleştir
  stopButton.disabled = true;
  startButton.disabled = false;
  downloadLinks.style.display = "block"; // Download linklerini görünür yap
};

// Ses dosyasını lamejs ile sıkıştırma fonksiyonu
function compressAudio(blob) {
  // Blob nesnesini bir arrayBuffer'a dönüştür
  let reader = new FileReader();
  reader.readAsArrayBuffer(blob);
  reader.onloadend = function () {
    // ArrayBuffer'ı AudioBuffer olarak oku
    let audioCtx = new AudioContext();
    audioCtx.decodeAudioData(reader.result).then(function (audioBuffer) {
      // lamejs.Mp3Encoder nesnesi oluştur
      let mp3encoder = new lamejs.Mp3Encoder(1, audioBuffer.sampleRate, 128);

      // Ses verisini normalize edin ve kodlayın
      let samples = audioBuffer.getChannelData(0).map((x) => x * 32767.5);
      let encoded = mp3encoder.encodeBuffer(samples);

      // Kodlanmış veriyi bir diziye ekleyin
      let mp3Data = [];
      mp3Data.push(encoded);
      mp3Data.push(mp3encoder.flush());

      // Diziyi bir Blob'a dönüştürün
      let blob = new Blob(mp3Data, { type: "audio/wav" });

      // Blob'u bir URL'ye dönüştürün ve bağlantı elemanına atayın
      let url = URL.createObjectURL(blob);
      let a = document.createElement("a");
      a.href = url;
      a.download = "compressaudio.wav";
      a.textContent = "Sıkıştırılmış ses dosyasını indir";
      downloadLinks.appendChild(a);
    });
  };
}
function removeDownloadLinks() {
  var downloadLinks = document.getElementById("downloadLinks");
  while (downloadLinks.firstChild) {
    downloadLinks.removeChild(downloadLinks.firstChild);
  }
}

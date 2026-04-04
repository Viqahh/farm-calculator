function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const validDaerah = ["Kendari", "Maros", "Takalar", "Sengkang", "Mamasa"];

  if (data.type === "submit") {
    if (!validDaerah.includes(data.daerah)) {
      return ContentService.createTextOutput(
        JSON.stringify({ status: "error", message: "Invalid daerah" })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    let sheet = ss.getSheetByName(data.daerah);
    if (!sheet) {
      sheet = ss.insertSheet(data.daerah);
      sheet.appendRow([
        "Submission Key",
        "Tanggal",
        "Nama Peternak",
        "Nama Bakul",
        "License",
        "Daerah",
        "Berat List",
        "Rata-Rata (per 10 ekor)",
        "Total Ayam",
        "Total Berat (kg)",
        "Download Status",
        "Timestamp"
      ]);
    }

    sheet.appendRow([
      data.submissionKey,
      data.tanggal,
      data.namaPeternak,
      data.namaBakul,
      data.license,
      data.daerah,
      data.beratList,
      data.rataRata,
      data.totalAyam,
      data.totalBerat,
      data.downloadStatus,
      new Date()
    ]);

    return ContentService.createTextOutput(
      JSON.stringify({ status: "success", message: "Data saved" })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  if (data.type === "download") {
    const sheets = ss.getSheets();
    for (const sheet of sheets) {
      const values = sheet.getDataRange().getValues();
      for (let i = 1; i < values.length; i++) {
        if (values[i][0] === data.submissionKey) {
          sheet.getRange(i + 1, 11).setValue(data.downloadStatus);
          return ContentService.createTextOutput(
            JSON.stringify({ status: "success", message: "Status updated" })
          ).setMimeType(ContentService.MimeType.JSON);
        }
      }
    }
    return ContentService.createTextOutput(
      JSON.stringify({ status: "error", message: "Submission key not found" })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(
    JSON.stringify({ status: "error", message: "Invalid request type" })
  ).setMimeType(ContentService.MimeType.JSON);
}

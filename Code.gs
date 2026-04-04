var VALID_DAERAH = ["Kendari", "Maros", "Takalar", "Sengkang", "Mamasa"];
var PROP_PREFIX = "DAERAH_SHEET_ID_";
var HEADERS = [
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
];

/**
 * Returns the dedicated Google Spreadsheet for the given daerah.
 * Creates a new one (named "{daerah}-Farm-Data") if it doesn't exist yet,
 * and persists the mapping in ScriptProperties so it survives across calls.
 */
function getOrCreateDaerahSpreadsheet(daerah) {
  var props = PropertiesService.getScriptProperties();
  var key = PROP_PREFIX + daerah;
  var spreadsheetId = props.getProperty(key);

  if (spreadsheetId) {
    try {
      return SpreadsheetApp.openById(spreadsheetId);
    } catch (err) {
      // Spreadsheet was deleted — fall through to recreate it
    }
  }

  // Create a brand-new Google Spreadsheet for this daerah
  var newSS = SpreadsheetApp.create(daerah + "-Farm-Data");
  var sheet = newSS.getActiveSheet();
  sheet.setName(daerah);
  sheet.appendRow(HEADERS);

  // Save the mapping so future calls can look it up
  props.setProperty(key, newSS.getId());

  return newSS;
}

function doPost(e) {
  var data = JSON.parse(e.postData.contents);

  if (data.type === "submit") {
    if (VALID_DAERAH.indexOf(data.daerah) === -1) {
      return ContentService.createTextOutput(
        JSON.stringify({ status: "error", message: "Invalid daerah" })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    var ss = getOrCreateDaerahSpreadsheet(data.daerah);
    var sheet = ss.getSheetByName(data.daerah);
    if (!sheet) {
      return ContentService.createTextOutput(
        JSON.stringify({ status: "error", message: "Sheet setup error for daerah: " + data.daerah })
      ).setMimeType(ContentService.MimeType.JSON);
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
    var props = PropertiesService.getScriptProperties();

    // Search every known daerah spreadsheet for the submission key
    for (var i = 0; i < VALID_DAERAH.length; i++) {
      var daerah = VALID_DAERAH[i];
      var spreadsheetId = props.getProperty(PROP_PREFIX + daerah);
      if (!spreadsheetId) continue;

      try {
        var ss = SpreadsheetApp.openById(spreadsheetId);
        var sheet = ss.getSheetByName(daerah);
        if (!sheet) continue;

        var values = sheet.getDataRange().getValues();
        for (var j = 1; j < values.length; j++) {
          if (values[j][0] === data.submissionKey) {
            sheet.getRange(j + 1, 11).setValue(data.downloadStatus);
            return ContentService.createTextOutput(
              JSON.stringify({ status: "success", message: "Status updated" })
            ).setMimeType(ContentService.MimeType.JSON);
          }
        }
      } catch (err) {
        // Skip inaccessible spreadsheets
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

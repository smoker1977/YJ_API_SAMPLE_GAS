/*****
 * 処理状況の更新
 *****/
function updateProcess(sheet_name, values) {
  var this_sheet = SpreadsheetApp.getActive().getSheetByName(sheet_name);
  this_sheet.getRange(2, 6).setValue(values);
}

/*****
 * 取得したCSVファイルの出力（）
 * 引数に入れられたシート名でシートを作成し、CSVで取得したデータを貼り付ける
 *****/
function updateCsv(sheet_name, data) {
  var values = Utilities.parseCsv(data);
  var this_sheet = SpreadsheetApp.getActive().getSheetByName(sheet_name);
  this_sheet.clearContents();
  this_sheet.getRange(1, 1, values.length, values[0].length).setValues(values);
}

/*****
 * スプレッドシートOPEN時にメニューを追加する
 *****/
function onOpen() {
  var ui = SpreadsheetApp.getUi();           // Uiクラスを取得する
  var menu = ui.createMenu('Yahoo!JAPAN 広告');  // Uiクラスからメニューを作成する
  menu.addItem('レポート出力', 'main_updateYahooReport');   // メニューにアイテムを追加する
  menu.addToUi();                            // メニューをUiクラスに追加する
}

/*****
 * シートを作成する
 *****/
function createSheet(sheet_Name){
  var objSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  objSpreadsheet.insertSheet(sheet_Name);
}

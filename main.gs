// Yahoo!広告の設定
var prop = PropertiesService.getScriptProperties();
const URL_TOKEN = prop.getProperty('URL_TOKEN');
const URL_API = prop.getProperty('URL_API');
const CLIENT_ID = prop.getProperty('CLIENT_ID');
const CLIENT_SECRET = prop.getProperty('CLIENT_SECRET');
const REFRESH_TOKEN = prop.getProperty('REFRESH_TOKEN');


// ACCOUNT（処理対象）シート名
const account_sheet_name = 'ACCOUNT';

function main_updateYahooReport() {
  
  //処理開始時刻の取得
  var startDate = Utilities.formatDate(new Date(), "Asia/Tokyo", "yyyyMMddHHmmss");
  
  //処理状況の追記
  updateProcess(account_sheet_name, "処理開始：" + Utilities.formatDate(new Date(), "Asia/Tokyo", "yyyy/MM/dd HH:mm:ss"));
  
  //アクセストークンのリフレッシュ
  var access_token = getAccessToken(REFRESH_TOKEN);
  
  //処理対象の取得
  var ss = SpreadsheetApp.getActive().getSheetByName(account_sheet_name);
  var last_row = ss.getLastRow();
  var account_list = ss.getRange(2, 1, last_row, 5).getValues();
  var sheet_name = account_list[0][2] + "-" + account_list[0][4] + "_" + startDate;

  //レポートフィールドの取得
  var repFields = getFields(URL_API, access_token, account_list[0][2]);
  var response_body = JSON.parse(repFields.getContentText());
  var listFields = [];
  //利用できないもの、impossibleCombinationFieldsが指定されているものは除外
  for (var i = 0; i < response_body.rval.fields.length; i++) {
    if (response_body.rval.fields[i].canSelect == true && response_body.rval.fields[i].impossibleCombinationFields == null) {
      listFields.push(String(response_body.rval.fields[i].fieldName));
    }
  }
    
  //レポートの登録
  var jobID_list = resistReport(URL_API, access_token, account_list[0][0], account_list[0][2], account_list[0][4], listFields, startDate);
  Logger.log(jobID_list.getContentText());
  var response_body = JSON.parse(jobID_list.getContentText());
  var report_id = String(response_body.rval.values[0].reportDefinition.reportJobId);
  Logger.log(report_id);
  
  //レポート作成の待機
  while(1){
    var jobID_list = waitReport(URL_API, access_token, account_list[0][0], report_id);
    Logger.log(jobID_list.getContentText());
    var response_body = JSON.parse(jobID_list.getContentText());
    var report_status = String(response_body.rval.values[0].reportDefinition.reportJobStatus);
    Logger.log(report_status);
    if (String(report_status) == "COMPLETED") {
      break;
    }
    Utilities.sleep(10000);
  }
  
  //レポートの取得
  var data = downloadReport(URL_API, access_token, account_list[0][0], report_id);
  var values = Utilities.parseCsv(data);
  
  //シートへの転記
  createSheet(sheet_name);
  updateCsv(sheet_name, data);

  //処理状況の追記
  updateProcess(account_sheet_name, "処理完了：" + Utilities.formatDate(new Date(), "Asia/Tokyo", "yyyy/MM/dd HH:mm:ss"));
  
}


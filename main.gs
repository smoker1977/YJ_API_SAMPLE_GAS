/*************************************
 *
 * Yahoo!広告 APIを利用するためのGAS
 *
 *************************************/

/**********************
 * Yahoo!広告 apiの基本情報の設定
 **********************/
//トークン用のURLを指定してください。
const URL_TOKEN = "https://biz-oauth.yahoo.co.jp/oauth/v1/token";
//API用のURLを指定してください。（バージョンを切り替える場合はv1の部分を対象のバージョンに書き換えてください。）
const URL_API = "https://ads-search.yahooapis.jp/api/v1";
//Yahoo!広告 APIの管理ツールで登録したアプリケーションのクライアントIDを指定してください。
const CLIENT_ID = "410923fcb747503246044716be26648a6ab821b224939ec3e01e2593cdc8e5a3";
//Yahoo!広告 APIの管理ツールで登録したアプリケーションのクライアントシークレットを指定してください。
const CLIENT_SECRET = "e52803129851035b139c2887773f6cdbc1467e5f395851aec50378422d15bbb3";
//Yahoo!広告 APIの認可時に取得したリフレッシュトークンを指定してください。
const REFRESH_TOKEN = "c982735a095f66398e22ffb5fc373420b8ba451e9d51bac378f17ba2b2d0bbe1";

/**********************
 * レポートを作成するのに必要な情報を設定
 **********************/
//対象のSS広告アカウントIDを指定してください。
var USER_ID = "1164087";
//レポートタイプを指定してください。
var REPORT_TYPE = "CAMPAIGN";
//レポートの期間指定のタイプを指定してください。
var REPORT_DATE_RANGE_TYPE = "YESTERDAY";
//レポートで出力したいフィールドを指定してください。
//例として、アカウントID、アカウント名、キャンペーンID、キャンペーン名、インプレッション数、クリック数、クリック率、コンバージョン数　を設定します。
var REPORT_FIELDS = ["ACCOUNT_ID" ,"ACCOUNT_NAME", "CAMPAIGN_ID","CAMPAIGN_NAME", "COST", "IMPS", "CLICKS", "CLICK_RATE", "CONVERSIONS" ];
//０インプレッションのデータを含めるかを指定してください。(TRUEの場合は含めます)
var REPORT_INCLUDE_ZERO_IMPS = "TRUE";

function main_REPORT_GET() {
  
  //処理開始時刻の取得
  var startDate = Utilities.formatDate(new Date(), "Asia/Tokyo", "yyyyMMddHHmmss");
  //シート名の作成
  var sheet_name = "レポート取得日時" + "_" + startDate;
  
  //アクセストークンのリフレッシュ
  var access_token = getAccessToken(REFRESH_TOKEN);

  //レポートの登録
  var jobID_list = resistReport(URL_API, access_token, USER_ID, REPORT_TYPE, REPORT_DATE_RANGE_TYPE, REPORT_FIELDS, REPORT_INCLUDE_ZERO_IMPS, startDate);
  Logger.log(jobID_list.getContentText());
  var response_body = JSON.parse(jobID_list.getContentText());
  var report_id = String(response_body.rval.values[0].reportDefinition.reportJobId);
  Logger.log(report_id);
  
  //レポート作成の待機
  while(1){
    var jobID_list = waitReport(URL_API, access_token, USER_ID, report_id);
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
  var data = downloadReport(URL_API, access_token, USER_ID, report_id);
  var values = Utilities.parseCsv(data);
  
  //シートへの転記
  createSheet(sheet_name);
  updateCsv(sheet_name, data);
  
  return;
  
}

/*****
 * AccessTokenの取得
 *****/
function getAccessToken(refresh_token) {
    var payload = {
        grant_type: 'refresh_token',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        refresh_token: REFRESH_TOKEN
    };
    var params = {
        payload : payload
    };

    var response = UrlFetchApp.fetch(URL_TOKEN, params);
    var response_body = JSON.parse(response.getContentText());

    return response_body['access_token'];
}

/*****
 * レポートのダウンロード
 *****/
function downloadReport(url, access_token, account_id, report_jod_id) {
    var headers = {
        'Authorization': 'Bearer ' + access_token
    };
    var payload = {
        accountId: parseInt(account_id),
        reportJobId: report_jod_id
    };
    var params = {
        method : 'post',
        contentType: 'application/json',
        headers: headers,
        payload: JSON.stringify(payload)
    };

    var response = UrlFetchApp.fetch(url + '/ReportDefinitionService/download', params);
    return response;
}

/*****
 * レポートの登録
 *****/
function resistReport(URL_API, access_token, account, type, range, listFields, zeroImps, repName){
  var headers = {
    'Authorization': 'Bearer ' + access_token
  };
  
  var payload = {
    accountId: parseInt(account),
    operand: [{
      fields: listFields,
      reportDateRangeType: range,
      reportDownloadEncode: "UTF-8",
      reportName: repName,
      reportType: type,
      reportIncludeZeroImpressions: zeroImps
    }]
  };
  Logger.log(JSON.stringify(payload));
  
  var params = {
    method : 'post',
    contentType: 'application/json',
    headers: headers,
    payload: JSON.stringify(payload)
  };
  var response = UrlFetchApp.fetch(URL_API + '/ReportDefinitionService/add', params);
  return response;
  
}

/*****
 * レポートのステータスを返却する
 *****/
function waitReport(URL_API, access_token, account_id, report_id){
  var headers = {
    'Authorization': 'Bearer ' + access_token
  };
  
  var payload = {
    accountId: parseInt(account_id),
    reportJobIds: [
      parseFloat(report_id)
    ]
  };
  Logger.log(payload);
  
  var params = {
    method : 'post',
    contentType: 'application/json',
    headers: headers,
    payload: JSON.stringify(payload)
  };
  var response = UrlFetchApp.fetch(URL_API + '/ReportDefinitionService/get', params);
  return response;
  
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

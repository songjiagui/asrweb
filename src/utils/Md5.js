import { Md5 } from "ts-md5";
export const encipher = (s) => {
  const md5 = new Md5();
  const str = s + "hzgm";
  let val = "";
  for (let i = 0; i < str.length; i++) {
    if (val == "") val = str.charCodeAt(i).toString(16);
    else val += str.charCodeAt(i).toString(16) + ".";
  }
  md5.appendAsciiStr(val);
  const data = md5.end();
  return data;
};
export const add = (jsondata, addarr) => {
  if (jsondata && jsondata !== "[]") {
    // 将获取的数组转成json数据
    const arr1 = JSON.stringify(addarr);
    // 将json数据进行拼接并转化成数组
    const arr2 = arr1.substr(0, arr1.length - 1) + "," + jsondata.slice(1);
    const arr = JSON.parse(arr2);
    // 将数组进行去重并转为json数据
    const noRepeat = [...new Set(arr.map((item) => JSON.stringify(item)))];
    const result = noRepeat.map((item) => JSON.parse(item));
    //存入缓存
    return result;
  } else {
    return addarr;
  }
};
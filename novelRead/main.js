/**
 * 导入文件
 * @param {*} url 
 * @param {*} callback 
 */
function loadScript(url, callback) {
  var script = document.createElement("script");
  script.type = "text/javascript";
  script.src = url;
  script.onload = function () {
    if (callback) callback();
  };
  document.head.appendChild(script);
}


/**
 * 获取 “_目录_  【 第n章 】” 存在位置的数组
 * @param {string} text 
 * @param {boolean} hasText 
 * hasText = false
 * @returns [1,20,50] 
 * hasText = true
 * @returns [text: '_目录_  【 第1章 】', start: 297, end: 310] 
 */
function getIndexArr(text, hasText = false) {
  let arr = [];
  let regex = /_目录_.*?】/g;

  if (hasText == false || !hasText) {
    arr = [...text.matchAll(regex)].map(match => (
      match.index // 匹配文本在原始字符串中的位置
    ));
  } else {
    arr = [...text.matchAll(regex)].map(match => ({
      text: match[0],    // 匹配的文本
      start: match.index, // 匹配文本在原始字符串中的位置
      end: match.index + match[0].length
    }));
  }

  return arr;
}

/**
 * TODO 获取不到，还需要修改此函数
 * 根据目录分割文字
 * @param {string} text 
 * @returns []
 */
function getConArr(text) {
  let arr = [];
  let regex = /_目录_.*?(?=_目录_|$)/g;
  console.log(text.match(regex));
  arr = text.match(regex);
  return arr;
}

/**
 * 输入文章，自动按章节格式' _目录_  【 第n章 】 '分割成数组
 * @param {string} text 
 * @param {number} index 0获取全部章节，-1获取全部章节数字，数字获取对应章节
 * @returns []
 */
function getContentArr(text, index = 0) {
  let arr = getIndexArr(text);
  let resultArr = [];
  if (index > arr.length) {
    alert('无对应章节');
    return false;
  }
  if (index == -1) {
    // 获取全部章节数字
    return arr.length;
  }
  for (let i = 0; i < arr.length; i++) {
    if (i < arr.length) {
      if (index == 0) {
        // 获取全部章节
        resultArr.push(text.slice(arr[i], arr[i + 1]));
      } else if (i == index - 1) {
        // 获取对应章节
        resultArr.push(text.slice(arr[i], arr[i + 1]));
      }
    }
  }
  return resultArr;
}

const synth = window.speechSynthesis;  // 获取浏览器的SpeechSynthesis接口
let utterance = null;  // 存储当前的语音内容
let speakObj = {};
/**
 * 播放语音
 * 在播放过程中修改音量没用
 * 需要在以下网址配置允许连续播放权限
 * chrome://settings/content/sound
 * @param {string} text 
 */
function readText(text = '', volume = 1) {
  // 创建一个SpeechSynthesisUtterance对象（语音合成的内容）
  utterance = new SpeechSynthesisUtterance(text);
  // 可选：设置语音的语言、音量、速度和音调
  utterance.lang = 'zh-CN';  // 设置中文
  utterance.volume = volume;      // 设置音量（0到1之间）
  utterance.rate = 1;        // 设置语速（0.1到10之间）
  utterance.pitch = 1;       // 设置音调（0到2之间）

  // 播放监听
  speakObj.isSpeak = 0;
  speakObj.textNow = '';
  speakObj.textIndex = 0;

  // 暂停|播放
  if (synth.speaking) {
    speakObj.isSpeak = 0;
    synth.cancel();
  } else {
    speakObj.isSpeak = 1;
    // 通过SpeechSynthesis实例播放文本
    synth.speak(utterance);
  }

  let count = 0, countArr = [], stop = true;
  // 在语音播放到结束时
  utterance.onboundary = (event) => {
    /* 记录三次当前播放序号 */
    if (countArr.length == 3) {
      countArr.shift();
    }
    countArr.push(event.charIndex);

    /* 当前播放序号event.charIndex重复的情况下记录次数 */
    if (countArr.length > 2 && countArr[0] == countArr[1] && countArr[1] + 1 == countArr[2]) {
      count++;
      /* 打印计数器重复次数 */
      // console.log(`---------repeat--------- count: ${count}`)
    }

    if (countArr.length == 2 && countArr[0] !== countArr[1] || countArr.length == 3 && countArr[1] !== countArr[2]) {
      /* 当前朗读的文字 */
      speakObj.textNow = event.target.text.slice(event.charIndex, event.charIndex + 1);
      /* 当前朗读的文字位置 */
      speakObj.textIndex = event.charIndex;
    }


    /* 判断朗读结束 */
    let timer = 0;
    if (event.charIndex + count >= utterance.text.length || utterance.text.length - event.charIndex < 5) {
      timer = Math.abs(event.charIndex + count - utterance.text.length) * 1000;

      if (stop) {
        stop = false;
        setTimeout(() => {
          speakObj.isSpeak = 3;
          synth.cancel();
          speakObj.textNow = event.target.text.slice(event.target.text.length - 2);
          /* 打印朗读完成、计数器重复次数、朗读完成后等待几秒 */
          console.log(`----------cancel---------- ${event.charIndex} / ${utterance.text.length} repeat:${count} timer:${timer}`);
        }, count * 300);
      }
    }
    /* 打印当前朗读文字序号、朗读剩余字数、计数器重复次数、朗读完成后等待几秒 */
    // console.log(`${event.charIndex} / ${utterance.text.length} ___ count:${count} ___ timer:${event.charIndex + count - utterance.text.length}`)
  };
}

/* 暂停语音播放 */
function pauseSpeaking() {
  if (synth.speaking) {
    speakObj.isSpeak = 2;
    synth.pause();
  }
}

/* 恢复语音播放 */
function resumeSpeaking() {
  if (synth.paused) {
    speakObj.isSpeak = 1;
    synth.resume();
  }
}


/* 文本内容 */
let conStr = '';
/* 章节序号数组 */
let conIndexArr = getIndexArr(conStr);
/* 章节内容数组 */
let conArr = getContentArr(conStr);
/* 当前章节页 */
let chapterCurrent = 1;
/* 总共章节页 */
let chapterTotal = conIndexArr.length;


loadScript("./data1.js", () => {
  conStr = data;
  conIndexArr = getIndexArr(conStr);
  conArr = getContentArr(conStr);
  chapterTotal = conIndexArr.length;
});


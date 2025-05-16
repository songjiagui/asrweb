import axios from 'axios'
import { ElMessage } from "element-plus";
const ip = 'http://localhost:4001/api'
axios.defaults.timeout = 15000
axios.defaults.baseURL = ip
axios.interceptors.request.use(
  config => {
    config.data = JSON.stringify(config.data);
    config.headers = {
      'Content-Type': "application/json;charset=utf-8",
      'authorization': window.localStorage.getItem("token")
    }
    return config;
  },
  err => {
    return Promise.reject(err);
  }
)
export const post = (url, data = {}) => {
  return new Promise((resolve, reject) => {
    axios.post(url, data, {
    }).then((response) => {
      resolve(response.data)
    }, err => {
      reject(err)
    })
  })
}

export const get = (url, params = {}) => {
  return new Promise((resolve, reject) => {
    axios.get(url, { params }, {
    }).then((response) => {
      resolve(response.data)
    }, err => {
      reject(err)
    })
  })
}

export const put = (url, data = {}) => {
  return new Promise((resolve, reject) => {
    axios.put(url, data, {
    }).then((response) => {
      resolve(response.data)
    }, err => {
      reject(err)
    })
  })
}

export const del = (url, params = {}) => {
  return new Promise((resolve, reject) => {
    axios.delete(url, { params }, {
    }).then((response) => {
      resolve(response.data)
    }, err => {
      reject(err)
    })
  })
}

export const generate = (filenam) => {
  return new Promise((resolve, reject) => {
    const eventSource = new EventSource(
      `${ip}/generate?filename=${filenam}`
    ); // 创建 EventSource 实例
    resolve(eventSource)
    eventSource.addEventListener("end", (e) => {
      try {
        eventSource.close();
        ElMessage.success("生成成功")
      } catch (error) {
        reject(error)
      }
    });
    eventSource.onerror = (e) => reject(e);
  })
}

export const uploadAudio = (url, formData) => {
  const fullUrl = `${ip}${url}`;
  const token = window.localStorage.getItem("token");
  
  return new Promise((resolve, reject) => {
    fetch(fullUrl, {
      method: 'POST',
      headers: {
        'authorization': token
      },
      body: formData
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      resolve(data);
    })
    .catch(err => {
      reject(err);
    });
  });
}
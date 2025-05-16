import { createRouter, createWebHashHistory } from "vue-router";

const routes = [
  {
    path: "/",
    name: "Home",
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(/* webpackChunkName: "about" */ "../views/Home.vue"),
    children: [
      {
        path: "/", //子路由前不需要加斜杠 /
        name: "my",
        props: true,
        component: () =>
          import(/* webpackChunkName: "about" */ "../components/home.vue"),
      },
      {
        path: "SpeechToText", //子路由前不需要加斜杠 /
        name: "SpeechToText",
        props: true,
        component: () =>
          import(/* webpackChunkName: "about" */ "../components/SpeechToText.vue"),
      },
      {
        path: "Model", //子路由前不需要加斜杠 /
        name: "Model",
        props: true,
        component: () =>
          import(/* webpackChunkName: "about" */ "../components/Model.vue"),
      },
      {
        path: "TextAdjustment", //子路由前不需要加斜杠 /
        name: "TextAdjustment",
        props: true,
        component: () =>
          import(/* webpackChunkName: "about" */ "../components/TextAdjustment.vue"),
      },
      {
        path: "History", //子路由前不需要加斜杠 /
        name: "History",
        props: true,
        component: () =>
          import(/* webpackChunkName: "about" */ "../components/History.vue"),
      },
      {
        path: "Profile", //子路由前不需要加斜杠 /
        name: "Profile",
        props: true,
        component: () =>
          import(/* webpackChunkName: "about" */ "../components/Profile.vue"),
      },
      {
        path: "LED", //子路由前不需要加斜杠 /
        name: "LED",
        props: true,
        component: () =>
          import(/* webpackChunkName: "about" */ "../components/LED.vue"),
      },
      {
        path: "Subtitle", //子路由前不需要加斜杠 /
        name: "Subtitle",
        props: true,
        component: () =>
          import(/* webpackChunkName: "Subtitle" */ "../components/Subtitle.vue"),
      },
      {
        path: "Voiceprint", //子路由前不需要加斜杠 /
        name: "Voiceprint",
        props: true,
        component: () =>
          import(/* webpackChunkName: "about" */ "../components/Voiceprint.vue"),
      },
      {
        path:"HearSetting",
        name:"HearSetting",
        props:true,
        component:()=>import("../components/HearSetting.vue")
      }
    ],
  },
  {
    path: "/Login",
    name: "Login",
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(/* webpackChunkName: "about" */ "../views/Login.vue"),
  },
  {
    path: "/:catchAll(.*)",
    name: "404",
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(/* webpackChunkName: "about" */ "../components/404.vue"),
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});
router.beforeEach((to, from, next) => {
  // 判断有没有登录
  if (!window.localStorage.getItem("token")) {
    if (to.name == "Login") {
      next();
    } else {
      router.push("/Login");
    }
  } else {
    next();
  }
});
export default router;

document.addEventListener("DOMContentLoaded", () => {
  // =========================================================
  // SUPABASE
  // =========================================================

  const SUPABASE_URL =
    "https://cwnjzwmficiuoybimqsc.supabase.co";

  const SUPABASE_KEY =
    "sb_publishable_HYnTEROkcBw7lrIKKNl21A_fmi1TsQV";

  let supabaseClient = null;

  if (window.supabase) {
    try {
      supabaseClient = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
      );
    } catch (error) {
      console.error("Supabase error:", error);
    }
  }

  // =========================================================
  // HELPERS
  // =========================================================

  const $ = (selector) => document.querySelector(selector);

  const $$ = (selector) =>
    Array.from(document.querySelectorAll(selector));

  function safeText(selector, value) {
    const element = $(selector);

    if (element) {
      element.textContent = value;
    }
  }

  function getNumber(selector, fallback = 0) {
    const element = $(selector);

    if (!element) return fallback;

    const value = Number(element.value);

    return Number.isFinite(value) ? value : fallback;
  }

  function showMessage(message, type = "info") {
    let box = $("#appMessage");

    if (!box) {
      box = document.createElement("div");
      box.id = "appMessage";

      Object.assign(box.style, {
        position: "fixed",
        bottom: "20px",
        left: "20px",
        right: "20px",
        zIndex: "99999",
        padding: "15px",
        borderRadius: "14px",
        background: "#111827",
        color: "#fff",
        textAlign: "center",
        fontWeight: "700",
        boxShadow: "0 10px 30px rgba(0,0,0,.25)"
      });

      document.body.appendChild(box);
    }

    box.textContent = message;

    box.style.background =
      type === "error"
        ? "#b91c1c"
        : type === "success"
        ? "#15803d"
        : "#111827";

    clearTimeout(box._timer);

    box._timer = setTimeout(() => {
      box.remove();
    }, 4000);
  }

  function showScreen(id) {
    $$(".screen").forEach((screen) => {
      screen.classList.add("hidden");
    });

    const screen = $(`#${id}`);

    if (screen) {
      screen.classList.remove("hidden");
    }
  }

  function todayKey() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  // =========================================================
  // LOCAL DATA
  // =========================================================

  const STORAGE_KEY = "dr_elorabi_user";

  let userData = {};

  try {
    userData = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "{}"
    );
  } catch {
    userData = {};
  }

  function saveLocalData() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(userData)
    );
  }

  // =========================================================
  // AUTH SCREEN SWITCH
  // =========================================================

  const showSignup = $("#showSignup");
  const showLogin = $("#showLogin");

  if (showSignup) {
    showSignup.addEventListener("click", () => {
      $("#loginBox")?.classList.add("hidden");
      $("#signupBox")?.classList.remove("hidden");
    });
  }

  if (showLogin) {
    showLogin.addEventListener("click", () => {
      $("#signupBox")?.classList.add("hidden");
      $("#loginBox")?.classList.remove("hidden");
    });
  }

  // =========================================================
  // AGE
  // =========================================================

  function calculateAge(dateString) {
    if (!dateString) return 0;

    const birth = new Date(dateString);

    if (Number.isNaN(birth.getTime())) {
      return 0;
    }

    const today = new Date();

    let age =
      today.getFullYear() -
      birth.getFullYear();

    const month =
      today.getMonth() -
      birth.getMonth();

    if (
      month < 0 ||
      (
        month === 0 &&
        today.getDate() < birth.getDate()
      )
    ) {
      age--;
    }

    return Math.max(0, age);
  }

  // =========================================================
  // BMI
  // =========================================================

  function calculateBMI() {
    const weight = getNumber("#weight");
    const height = getNumber("#height");

    if (weight <= 0 || height <= 0) {
      return 0;
    }

    const heightMeters = height / 100;

    return weight /
      (heightMeters * heightMeters);
  }

  function bmiStatus(bmi) {
    if (bmi < 18.5) {
      return "نقص وزن";
    }

    if (bmi < 25) {
      return "طبيعي";
    }

    if (bmi < 30) {
      return "زيادة وزن";
    }

    return "سمنة";
  }

  // =========================================================
  // CALORIES
  // =========================================================

  function getActivityMultiplier() {
    const activity = $("#activity")?.value;

    const values = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      high: 1.725
    };

    return values[activity] || 1.2;
  }

  function calculateCalories() {
    const weight = getNumber("#weight");
    const height = getNumber("#height");
    const birthDate = $("#birthDate")?.value || "";
    const gender = $("#gender")?.value || "male";
    const goal = $("#goal")?.value || "maintenance";

    const age = calculateAge(birthDate);

    if (
      weight <= 0 ||
      height <= 0 ||
      age <= 0
    ) {
      return null;
    }

    let bmr;

    if (gender === "female") {
      bmr =
        (10 * weight) +
        (6.25 * height) -
        (5 * age) -
        161;
    } else {
      bmr =
        (10 * weight) +
        (6.25 * height) -
        (5 * age) +
        5;
    }

    const maintenance =
      bmr * getActivityMultiplier();

    let calories = maintenance;

    if (goal === "fat_loss") {
      calories = maintenance - 400;
    }

    if (goal === "muscle_gain") {
      calories = maintenance + 250;
    }

    if (goal === "recomposition") {
      calories = maintenance - 150;
    }

    if (goal === "maintenance") {
      calories = maintenance;
    }

    calories = Math.max(1200, calories);

    const protein =
      Math.round(weight * 1.8);

    const water =
      Math.round(weight * 35);

    return {
      age,
      bmr: Math.round(bmr),
      maintenance: Math.round(maintenance),
      calories: Math.round(calories),
      protein,
      water
    };
  }

  // =========================================================
  // DAILY DATA
  // =========================================================

  function getTodayData() {
    const key = todayKey();

    if (!userData.daily) {
      userData.daily = {};
    }

    if (!userData.daily[key]) {
      userData.daily[key] = {
        calories: 0,
        protein: 0,
        water: 0,
        meals: [],
        exercises: [],
        sleep: null
      };
    }

    return userData.daily[key];
  }

  // =========================================================
  // UPDATE DASHBOARD
  // =========================================================

  function updateDashboard() {
    const result = calculateCalories();

    if (!result) return;

    const today = getTodayData();

    safeText(
      "#calorieTarget",
      result.calories
    );

    safeText(
      "#proteinTarget",
      result.protein
    );

    safeText(
      "#waterTarget",
      result.water
    );

    safeText(
      "#caloriesConsumed",
      today.calories
    );

    safeText(
      "#caloriesGoal",
      result.calories
    );

    safeText(
      "#proteinConsumed",
      today.protein
    );

    safeText(
      "#proteinGoal",
      result.protein
    );

    safeText(
      "#waterConsumed",
      today.water
    );

    const bmi = calculateBMI();

    if (bmi > 0) {
      safeText(
        "#bmiValue",
        bmi.toFixed(1)
      );

      safeText(
        "#bmiStatus",
        bmiStatus(bmi)
      );
    }

    const caloriePercent =
      Math.min(
        100,
        (today.calories / result.calories) * 100
      );

    const proteinPercent =
      Math.min(
        100,
        (today.protein / result.protein) * 100
      );

    const calorieBar =
      $("#calorieProgress");

    const proteinBar =
      $("#proteinProgress");

    if (calorieBar) {
      calorieBar.style.width =
        `${caloriePercent}%`;
    }

    if (proteinBar) {
      proteinBar.style.width =
        `${proteinPercent}%`;
    }

    renderFoodList();

    saveLocalData();
  }

  // =========================================================
  // PROFILE
  // =========================================================

  const profileForm =
    $("#profileForm");

  if (profileForm) {
    profileForm.addEventListener(
      "submit",
      async (event) => {
        event.preventDefault();

        const name =
          $("#fullName")?.value.trim();

        const birthDate =
          $("#birthDate")?.value;

        const gender =
          $("#gender")?.value;

        const height =
          getNumber("#height");

        const weight =
          getNumber("#weight");

        const goal =
          $("#goal")?.value;

        const activity =
          $("#activity")?.value;

        const likedFoods =
          $("#likedFoods")?.value.trim();

        const dislikedFoods =
          $("#dislikedFoods")?.value.trim();

        const allergies =
          $("#allergies")?.value.trim();

        const mealsPerDay =
          Number(
            $("#mealsPerDay")?.value || 4
          );

        if (
          !name ||
          !birthDate ||
          !gender ||
          !height ||
          !weight ||
          !goal ||
          !activity
        ) {
          showMessage(
            "اكمل كل البيانات المطلوبة",
            "error"
          );

          return;
        }

        userData.name = name;
        userData.birthDate = birthDate;
        userData.gender = gender;
        userData.height = height;
        userData.weight = weight;
        userData.goal = goal;
        userData.activity = activity;
        userData.likedFoods = likedFoods;
        userData.dislikedFoods = dislikedFoods;
        userData.allergies = allergies;
        userData.mealsPerDay = mealsPerDay;

        userData.profileCompleted = true;

        saveLocalData();

        await saveProfileToSupabase();

        updateDashboard();

        showDashboard();

        showMessage(
          "تم حفظ بياناتك وبناء خطتك بنجاح",
          "success"
        );
      }
    );
  }

  // =========================================================
  // SUPABASE PROFILE
  // =========================================================

  async function saveProfileToSupabase() {
    if (!supabaseClient) return;

    try {
      const {
        data,
        error
      } =
        await supabaseClient.auth.getUser();

      const user = data?.user;

      if (!user) return;

      const profile = {
        id: user.id,
        email: user.email,
        full_name: userData.name,
        birth_date: userData.birthDate,
        gender: userData.gender,
        height: userData.height,
        weight: userData.weight,
        goal: userData.goal,
        activity: userData.activity,
        liked_foods: userData.likedFoods,
        disliked_foods: userData.dislikedFoods,
        allergies: userData.allergies,
        meals_per_day: userData.mealsPerDay
      };

      const result =
        await supabaseClient
          .from("profiles")
          .upsert(profile);

      if (result.error) {
        console.warn(
          "Profile save:",
          result.error
        );
      }
    } catch (error) {
      console.warn(error);
    }
  }

  // =========================================================
  // SHOW DASHBOARD
  // =========================================================

  function showDashboard() {
    showScreen("dashboardScreen");

    safeText(
      "#welcomeName",
      userData.name || "اهلا بيك"
    );

    updateDashboard();
    updateDate();
  }

  function showProfile() {
    showScreen("profileScreen");

    loadProfileInputs();
  }

  function loadProfileInputs() {
    if (userData.name) {
      $("#fullName").value =
        userData.name;
    }

    if (userData.birthDate) {
      $("#birthDate").value =
        userData.birthDate;
    }

    if (userData.gender) {
      $("#gender").value =
        userData.gender;
    }

    if (userData.height) {
      $("#height").value =
        userData.height;
    }

    if (userData.weight) {
      $("#weight").value =
        userData.weight;
    }

    if (userData.goal) {
      $("#goal").value =
        userData.goal;
    }

    if (userData.activity) {
      $("#activity").value =
        userData.activity;
    }

    if (userData.likedFoods) {
      $("#likedFoods").value =
        userData.likedFoods;
    }

    if (userData.dislikedFoods) {
      $("#dislikedFoods").value =
        userData.dislikedFoods;
    }

    if (userData.allergies) {
      $("#allergies").value =
        userData.allergies;
    }

    if (userData.mealsPerDay) {
      $("#mealsPerDay").value =
        userData.mealsPerDay;
    }
  }

  // =========================================================
  // FOOD DATABASE
  // =========================================================

  const foods = {
    chicken: {
      name: "صدر فراخ مشوي",
      calories: 165,
      protein: 31
    },

    rice: {
      name: "أرز مطبوخ",
      calories: 130,
      protein: 2.7
    },

    eggs: {
      name: "بيض",
      calories: 143,
      protein: 12.6
    },

    oats: {
      name: "شوفان",
      calories: 389,
      protein: 16.9
    },

    banana: {
      name: "موز",
      calories: 89,
      protein: 1.1
    },

    yogurt: {
      name: "زبادي",
      calories: 61,
      protein: 3.5
    },

    tuna: {
      name: "تونة",
      calories: 132,
      protein: 28
    },

    potato: {
      name: "بطاطس",
      calories: 77,
      protein: 2
    },

    bread: {
      name: "خبز",
      calories: 265,
      protein: 9
    },

    milk: {
      name: "لبن",
      calories: 61,
      protein: 3.2
    },

    pasta: {
      name: "مكرونة مطبوخة",
      calories: 157,
      protein: 5.8
    },

    beef: {
      name: "لحم بقري",
      calories: 250,
      protein: 26
    },

    cheese: {
      name: "جبنة",
      calories: 350,
      protein: 25
    }
  };

  function detectFood(text) {
    const value =
      String(text)
        .toLowerCase()
        .trim();

    if (
      value.includes("فراخ") ||
      value.includes("دجاج") ||
      value.includes("chicken")
    ) {
      return foods.chicken;
    }

    if (
      value.includes("رز") ||
      value.includes("أرز") ||
      value.includes("rice")
    ) {
      return foods.rice;
    }

    if (
      value.includes("بيض") ||
      value.includes("egg")
    ) {
      return foods.eggs;
    }

    if (
      value.includes("شوفان") ||
      value.includes("oat")
    ) {
      return foods.oats;
    }

    if (
      value.includes("موز") ||
      value.includes("banana")
    ) {
      return foods.banana;
    }

    if (
      value.includes("زبادي") ||
      value.includes("yogurt")
    ) {
      return foods.yogurt;
    }

    if (
      value.includes("تونة") ||
      value.includes("tuna")
    ) {
      return foods.tuna;
    }

    if (
      value.includes("بطاطس") ||
      value.includes("potato")
    ) {
      return foods.potato;
    }

    if (
      value.includes("عيش") ||
      value.includes("خبز") ||
      value.includes("bread")
    ) {
      return foods.bread;
    }

    if (
      value.includes("لبن") ||
      value.includes("milk")
    ) {
      return foods.milk;
    }

    if (
      value.includes("مكرونة") ||
      value.includes("مكرونه") ||
      value.includes("pasta")
    ) {
      return foods.pasta;
    }

    if (
      value.includes("لحمة") ||
      value.includes("لحم") ||
      value.includes("beef")
    ) {
      return foods.beef;
    }

    if (
      value.includes("جبنة") ||
      value.includes("جبنه") ||
      value.includes("cheese")
    ) {
      return foods.cheese;
    }

    return null;
  }

  function calculateFood(food, grams) {
    if (!food || grams <= 0) {
      return null;
    }

    return {
      calories: Math.round(
        food.calories * grams / 100
      ),

      protein: Math.round(
        food.protein * grams / 100
      )
    };
  }

  // =========================================================
  // FOOD FORM
  // =========================================================

  const foodForm =
    $("#foodForm");

  if (foodForm) {
    foodForm.addEventListener(
      "submit",
      (event) => {
        event.preventDefault();

        const foodName =
          $("#foodName")
            ?.value
            ?.trim();

        const caloriesInput =
          $("#foodCalories");

        const proteinInput =
          $("#foodProtein");

        const food =
          detectFood(foodName);

        const caloriesManual =
          getNumber("#foodCalories");

        const proteinManual =
          getNumber("#foodProtein");

        let calories =
          caloriesManual;

        let protein =
          proteinManual;

        if (food) {
          const gramMatch =
            foodName.match(
              /(\d+(?:\.\d+)?)\s*(?:جرام|غرام|g|جم)?/i
            );

          if (gramMatch) {
            const grams =
              Number(gramMatch[1]);

            const calculated =
              calculateFood(
                food,
                grams
              );

            if (calculated) {
              calories =
                caloriesManual > 0
                  ? caloriesManual
                  : calculated.calories;

              protein =
                proteinManual > 0
                  ? proteinManual
                  : calculated.protein;
            }
          }
        }

        if (
          calories <= 0 ||
          protein < 0
        ) {
          showMessage(
            "اكتب السعرات والبروتين بشكل صحيح",
            "error"
          );

          return;
        }

        const today =
          getTodayData();

        today.calories += calories;
        today.protein += protein;

        today.meals.push({
          name: foodName,
          type:
            $("#mealType")?.value ||
            "meal",
          calories,
          protein,
          time:
            new Date().toISOString()
        });

        saveLocalData();

        updateDashboard();

        closeModal("foodModal");

        foodForm.reset();

        showMessage(
          "تم تسجيل الوجبة بنجاح",
          "success"
        );
      }
    );
  }

  // =========================================================
  // FOOD LIST
  // =========================================================

  function renderFoodList() {
    const list =
      $("#foodList");

    if (!list) return;

    const today =
      getTodayData();

    if (!today.meals?.length) {
      list.innerHTML = `
        <div class="empty-state">
          مفيش وجبات مسجلة لسه
        </div>
      `;

      return;
    }

    list.innerHTML =
      today.meals
        .map((meal) => `
          <div class="food-item">
            <div>
              <strong>
                ${escapeHTML(meal.name)}
              </strong>

              <small>
                ${meal.calories} kcal
                • ${meal.protein}g protein
              </small>
            </div>
          </div>
        `)
        .join("");
  }

  function escapeHTML(text) {
    return String(text)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // =========================================================
  // WATER
  // =========================================================

  function addWater(amount = 250) {
    const today =
      getTodayData();

    today.water += amount;

    saveLocalData();

    updateDashboard();

    showMessage(
      `تم تسجيل ${amount} مل ماء`,
      "success"
    );
  }

  $("#waterBtn")?.addEventListener(
    "click",
    () => {
      addWater(250);
    }
  );

  $("#addWaterBtn")?.addEventListener(
    "click",
    () => {
      addWater(250);
    }
  );

  // =========================================================
  // SLEEP
  // =========================================================

  $("#sleepForm")?.addEventListener(
    "submit",
    (event) => {
      event.preventDefault();

      const start =
        new Date(
          $("#sleepTime").value
        );

      const end =
        new Date(
          $("#wakeTime").value
        );

      if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime())
      ) {
        showMessage(
          "اختار وقت النوم والاستيقاظ",
          "error"
        );

        return;
      }

      if (end <= start) {
        end.setDate(
          end.getDate() + 1
        );
      }

      const hours =
        (end - start) /
        (1000 * 60 * 60);

      const today =
        getTodayData();

      today.sleep = {
        start: start.toISOString(),
        end: end.toISOString(),
        hours
      };

      saveLocalData();

      const result =
        $("#sleepResult");

      if (result) {
        result.innerHTML = `
          <div class="sleep-result">
            نومك: <strong>
              ${hours.toFixed(1)} ساعة
            </strong>
          </div>
        `;
      }

      showMessage(
        "تم تسجيل النوم بنجاح",
        "success"
      );
    }
  );

  // =========================================================
  // EXERCISE
  // =========================================================

  $("#exerciseForm")?.addEventListener(
    "submit",
    (event) => {
      event.preventDefault();

      const name =
        $("#exerciseName")
          ?.value
          ?.trim();

      const duration =
        getNumber(
          "#exerciseDuration"
        );

      const calories =
        getNumber(
          "#exerciseCalories"
        );

      if (
        !name ||
        duration <= 0
      ) {
        showMessage(
          "اكتب بيانات التمرين بشكل صحيح",
          "error"
        );

        return;
      }

      const today =
        getTodayData();

      today.exercises.push({
        name,
        duration,
        calories,
        time:
          new Date().toISOString()
      });

      saveLocalData();

      closeModal("exerciseModal");

      $("#exerciseForm").reset();

      showMessage(
        "تم تسجيل التمرين بنجاح",
        "success"
      );
    }
  );

  // =========================================================
  // MODALS
  // =========================================================

  function openModal(id) {
    const modal = $(`#${id}`);

    if (modal) {
      modal.classList.remove("hidden");
    }
  }

  function closeModal(id) {
    const modal = $(`#${id}`);

    if (modal) {
      modal.classList.add("hidden");
    }
  }

  $("#logFoodBtn")?.addEventListener(
    "click",
    () => openModal("foodModal")
  );

  $("#sleepBtn")?.addEventListener(
    "click",
    () => openModal("sleepModal")
  );

  $("#exerciseBtn")?.addEventListener(
    "click",
    () => openModal("exerciseModal")
  );

  $("#proBtn")?.addEventListener(
    "click",
    () => openModal("proModal")
  );

  $$(".close-modal").forEach(
    (button) => {
      button.addEventListener(
        "click",
        () => {
          const id =
            button.dataset.close;

          if (id) {
            closeModal(id);
          }
        }
      );
    }
  );

  $$(".modal").forEach(
    (modal) => {
      modal.addEventListener(
        "click",
        (event) => {
          if (
            event.target === modal
          ) {
            modal.classList.add(
              "hidden"
            );
          }
        }
      );
    }
  );

  // =========================================================
  // PRO PAYMENT
  // =========================================================

  const requestProBtn =
    $("#requestProBtn");

  const paymentScreenshot =
    $("#paymentScreenshot");

  const confirmPaymentBtn =
    $("#confirmPaymentBtn");

  const paymentLink =
    $("#paymentLink");

  const proPaymentArea =
    $("#proPaymentArea");

  const proMessage =
    $("#proMessage");

  const PAYMENT_URL =
    "https://ipn.eg/S/ahmed-6163/instapay/4RLjXi";

  if (requestProBtn) {
    requestProBtn.addEventListener(
      "click",
      () => {
        if (proPaymentArea) {
          proPaymentArea.classList.remove(
            "hidden"
          );
        }

        if (proMessage) {
          proMessage.textContent =
            `أهلا ${userData.name || "مستخدم"} 👋

لتفعيل dr.elorabi PRO:

💰 قيمة الاشتراك: 50 جنيه

1️⃣ اضغط زر الدفع.
2️⃣ حول 50 جنيه.
3️⃣ خذ Screenshot للتحويل.
4️⃣ ارفع صورة التحويل.
5️⃣ اضغط تأكيد الدفع.

سيتم مراجعة التحويل من الإدارة.`;
        }

        if (paymentLink) {
          paymentLink.href =
            PAYMENT_URL;

          paymentLink.style.display =
            "block";
        }

        showMessage(
          "ادفع 50 جنيه ثم ارفع صورة التحويل"
        );
      }
    );
  }

  if (paymentScreenshot) {
    paymentScreenshot.addEventListener(
      "change",
      () => {
        const file =
          paymentScreenshot.files?.[0];

        if (!file) return;

        if (
          !file.type.startsWith(
            "image/"
          )
        ) {
          showMessage(
            "ارفع صورة فقط",
            "error"
          );

          paymentScreenshot.value = "";

          return;
        }

        if (
          file.size >
          5 * 1024 * 1024
        ) {
          showMessage(
            "حجم الصورة أكبر من 5MB",
            "error"
          );

          paymentScreenshot.value = "";

          return;
        }

        if (confirmPaymentBtn) {
          confirmPaymentBtn.style.display =
            "block";
        }

        showMessage(
          "تم اختيار صورة التحويل"
        );
      }
    );
  }

  if (confirmPaymentBtn) {
    confirmPaymentBtn.addEventListener(
      "click",
      async () => {
        try {
          if (!supabaseClient) {
            showMessage(
              "Supabase غير متصل",
              "error"
            );

            return;
          }

          const {
            data,
            error
          } =
            await supabaseClient.auth
              .getUser();

          if (
            error ||
            !data?.user
          ) {
            showMessage(
              "سجل دخولك أولا",
              "error"
            );

            return;
          }

          const file =
            paymentScreenshot?.files?.[0];

          if (!file) {
            showMessage(
              "ارفع صورة التحويل أولا",
              "error"
            );

            return;
          }

          confirmPaymentBtn.disabled =
            true;

          confirmPaymentBtn.textContent =
            "جاري إرسال الطلب...";

          const user =
            data.user;

          const extension =
            file.name
              .split(".")
              .pop()
              ?.toLowerCase() ||
            "jpg";

          const filePath =
            `${user.id}/${Date.now()}.${extension}`;

          const {
            error: uploadError
          } =
            await supabaseClient.storage
              .from(
                "payment-screenshots"
              )
              .upload(
                filePath,
                file,
                {
                  cacheControl: "3600",
                  upsert: false
                }
              );

          if (uploadError) {
            console.error(
              uploadError
            );

            throw new Error(
              "فشل رفع صورة التحويل"
            );
          }

          const {
            data: publicData
          } =
            supabaseClient.storage
              .from(
                "payment-screenshots"
              )
              .getPublicUrl(
                filePath
              );

          const screenshotUrl =
            publicData?.publicUrl ||
            filePath;

          const {
            error: dbError
          } =
            await supabaseClient
              .from(
                "payment_requests"
              )
              .insert({
                user_id: user.id,
                amount: 50,
                payment_method:
                  "InstaPay",
                transaction_reference:
                  null,
                screenshot_url:
                  screenshotUrl,
                status: "pending"
              });

          if (dbError) {
            console.error(
              dbError
            );

            throw new Error(
              "فشل تسجيل طلب الدفع"
            );
          }

          userData.paymentStatus =
            "pending";

          userData.paymentSubmittedAt =
            new Date().toISOString();

          saveLocalData();

          if (proMessage) {
            proMessage.textContent =
              `✅ تم إرسال طلب الدفع بنجاح.

سيتم مراجعة التحويل من الإدارة.

بعد الموافقة سيتم تفعيل PRO.`;
          }

          confirmPaymentBtn.textContent =
            "تم إرسال الطلب ✓";

          showMessage(
            "تم إرسال طلب PRO للإدارة",
            "success"
          );

        } catch (error) {
          console.error(error);

          confirmPaymentBtn.disabled =
            false;

          confirmPaymentBtn.textContent =
            "تأكيد الدفع";

          showMessage(
            error.message ||
            "حدث خطأ غير متوقع",
            "error"
          );
        }
      }
    );
  }

  // =========================================================
  // SIGN UP
  // =========================================================

  const signupForm =
    $("#signupForm");

  if (signupForm) {
    signupForm.addEventListener(
      "submit",
      async (event) => {
        event.preventDefault();

        if (!supabaseClient) {
          showMessage(
            "Supabase غير متصل",
            "error"
          );

          return;
        }

        const email =
          $("#signupEmail")
            ?.value
            ?.trim();

        const password =
          $("#signupPassword")
            ?.value;

        if (
          !email ||
          !password
        ) {
          showMessage(
            "اكتب البريد وكلمة المرور",
            "error"
          );

          return;
        }

        if (password.length < 6) {
          showMessage(
            "كلمة المرور لازم تكون 6 حروف أو أكثر",
            "error"
          );

          return;
        }

        const {
          error
        } =
          await supabaseClient.auth
            .signUp({
              email,
              password
            });

        if (error) {
          console.error(error);

          showMessage(
            error.message,
            "error"
          );

          return;
        }

        showMessage(
          "تم إنشاء الحساب بنجاح. لو طلب منك تأكيد البريد، راجع الإيميل.",
          "success"
        );

        $("#signupBox")
          ?.classList.add(
            "hidden"
          );

        $("#loginBox")
          ?.classList.remove(
            "hidden"
          );
      }
    );
  }

  // =========================================================
  // LOGIN
  // =========================================================

  const loginForm =
    $("#loginForm");

  if (loginForm) {
    loginForm.addEventListener(
      "submit",
      async (event) => {
        event.preventDefault();

        if (!supabaseClient) {
          showMessage(
            "Supabase غير متصل",
            "error"
          );

          return;
        }

        const email =
          $("#loginEmail")
            ?.value
            ?.trim();

        const password =
          $("#loginPassword")
            ?.value;

        if (
          !email ||
          !password
        ) {
          showMessage(
            "اكتب البريد وكلمة المرور",
            "error"
          );

          return;
        }

        const {
          error
        } =
          await supabaseClient.auth
            .signInWithPassword({
              email,
              password
            });

        if (error) {
          console.error(error);

          showMessage(
            error.message,
            "error"
          );

          return;
        }

        showMessage(
          "تم تسجيل الدخول بنجاح",
          "success"
        );

        await loadCurrentUser();
      }
    );
  }

  // =========================================================
  // LOGOUT
  // =========================================================

  $("#logoutBtn")?.addEventListener(
    "click",
    async () => {
      if (supabaseClient) {
        await supabaseClient.auth.signOut();
      }

      userData = {};

      localStorage.removeItem(
        STORAGE_KEY
      );

      showScreen("authScreen");

      showMessage(
        "تم تسجيل الخروج",
        "success"
      );
    }
  );

  // =========================================================
  // LOAD CURRENT USER
  // =========================================================

  async function loadCurrentUser() {
    if (!supabaseClient) {
      if (userData.profileCompleted) {
        showDashboard();
      } else {
        showScreen("authScreen");
      }

      return;
    }

    try {
      const {
        data
      } =
        await supabaseClient.auth
          .getUser();

      const user =
        data?.user;

      if (!user) {
        showScreen("authScreen");
        return;
      }

      await loadProfileFromSupabase(
        user
      );

      if (
        userData.profileCompleted
      ) {
        showDashboard();
      } else {
        showProfile();
      }

    } catch (error) {
      console.error(error);

      if (
        userData.profileCompleted
      ) {
        showDashboard();
      } else {
        showScreen("authScreen");
      }
    }
  }

  // =========================================================
  // LOAD PROFILE FROM SUPABASE
  // =========================================================

  async function loadProfileFromSupabase(user) {
    if (!supabaseClient) return;

    try {
      const {
        data,
        error
      } =
        await supabaseClient
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

      if (error) {
        console.warn(
          "Profile load:",
          error
        );

        return;
      }

      if (!data) return;

      userData.name =
        data.full_name ||
        userData.name ||
        "";

      userData.birthDate =
        data.birth_date ||
        userData.birthDate ||
        "";

      userData.gender =
        data.gender ||
        userData.gender ||
        "";

      userData.height =
        data.height ||
        userData.height ||
        "";

      userData.weight =
        data.weight ||
        userData.weight ||
        "";

      userData.goal =
        data.goal ||
        userData.goal ||
        "";

      userData.activity =
        data.activity ||
        userData.activity ||
        "";

      userData.likedFoods =
        data.liked_foods ||
        "";

      userData.dislikedFoods =
        data.disliked_foods ||
        "";

      userData.allergies =
        data.allergies ||
        "";

      userData.mealsPerDay =
        data.meals_per_day ||
        4;

      userData.profileCompleted =
        Boolean(
          data.full_name &&
          data.birth_date &&
          data.height &&
          data.weight &&
          data.goal
        );

      saveLocalData();

    } catch (error) {
      console.warn(error);
    }
  }

  // =========================================================
  // DATE
  // =========================================================

  function updateDate() {
    const now = new Date();

    const text =
      now.toLocaleDateString(
        "ar-EG",
        {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric"
        }
      );

    safeText(
      "#todayText",
      text
    );
  }

  // =========================================================
  // LIVE CLOCK
  // =========================================================

  function updateClock() {
    const now = new Date();

    safeText(
      "#liveClock",
      now.toLocaleTimeString(
        "ar-EG"
      )
    );

    safeText(
      "#todayDate",
      now.toLocaleDateString(
        "ar-EG",
        {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric"
        }
      )
    );
  }

  setInterval(
    updateClock,
    1000
  );

  // =========================================================
  // LIVE PROFILE CALCULATION
  // =========================================================

  [
    "#weight",
    "#height",
    "#birthDate",
    "#gender",
    "#goal",
    "#activity"
  ].forEach(
    (selector) => {
      const element = $(selector);

      if (!element) return;

      element.addEventListener(
        "input",
        () => {
          updateDashboard();
        }
      );

      element.addEventListener(
        "change",
        () => {
          updateDashboard();
        }
      );
    }
  );

  // =========================================================
  // INITIAL
  // =========================================================

  loadProfileInputs();

  updateDate();
  updateClock();
  updateDashboard();

  loadCurrentUser();

  console.log(
    "dr.elorabi application loaded successfully."
  );
});

/* =========================================================
   dr.elorabi
   Personal Health, Fitness & Nutrition App
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  // =========================
  // SUPABASE
  // =========================

  const SUPABASE_URL =
    "https://cwnjzwmficiuoybimqsc.supabase.co";

  const SUPABASE_KEY =
    "sb_publishable_HYnTEROkcBw7lrIKKNl21A_fmi1TsQV";

  let supabaseClient = null;

  if (window.supabase && SUPABASE_URL && SUPABASE_KEY) {
    try {
      supabaseClient = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
      );
    } catch (error) {
      console.error("Supabase initialization error:", error);
    }
  }

  // =========================
  // HELPERS
  // =========================

  const $ = (selector) =>
    document.querySelector(selector);

  const $$ = (selector) =>
    Array.from(document.querySelectorAll(selector));

  function showMessage(message, type = "info") {

    let box = $("#appMessage");

    if (!box) {
      box = document.createElement("div");

      box.id = "appMessage";

      box.style.position = "fixed";
      box.style.left = "20px";
      box.style.right = "20px";
      box.style.bottom = "20px";
      box.style.zIndex = "99999";
      box.style.padding = "15px";
      box.style.borderRadius = "14px";
      box.style.background = "#111827";
      box.style.color = "white";
      box.style.textAlign = "center";
      box.style.fontWeight = "600";

      document.body.appendChild(box);
    }

    box.textContent = message;

    clearTimeout(box._timer);

    box._timer = setTimeout(() => {
      box.remove();
    }, 4000);
  }

  function safeText(selector, value) {

    const element = $(selector);

    if (element) {
      element.textContent = value;
    }
  }

  function getNumber(selector, fallback = 0) {

    const element = $(selector);

    if (!element) return fallback;

    const number = Number(element.value);

    return Number.isFinite(number)
      ? number
      : fallback;
  }

  // =========================
  // LOCAL USER DATA
  // =========================

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

  // =========================
  // AGE CALCULATOR
  // =========================

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

    const monthDifference =
      today.getMonth() -
      birth.getMonth();

    if (
      monthDifference < 0 ||
      (
        monthDifference === 0 &&
        today.getDate() < birth.getDate()
      )
    ) {
      age--;
    }

    return Math.max(0, age);
  }

  // =========================
  // CALORIE CALCULATOR
  // =========================

  function calculateCalories() {

    const weight =
      getNumber("#weight", 0);

    const height =
      getNumber("#height", 0);

    let birthDate = "";

    const birthElement =
      $("#birthDate");

    if (birthElement) {
      birthDate =
        birthElement.value;
    }

    const age =
      calculateAge(birthDate);

    const genderElement =
      $("input[name='gender']:checked");

    const gender =
      genderElement
        ? genderElement.value
        : "male";

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

    const activityElement =
      $("#activityLevel");

    const activity =
      activityElement
        ? Number(activityElement.value)
        : 1.375;

    const maintenance =
      bmr * activity;

    const goalElement =
      $("#goal");

    const goal =
      goalElement
        ? goalElement.value
        : "maintain";

    let target =
      maintenance;

    if (goal === "lose") {
      target =
        maintenance - 400;
    }

    if (goal === "gain") {
      target =
        maintenance + 250;
    }

    if (goal === "recomp") {
      target =
        maintenance - 150;
    }

    const protein =
      Math.round(weight * 1.8);

    return {

      age,

      bmr:
        Math.round(bmr),

      maintenance:
        Math.round(maintenance),

      calories:
        Math.round(target),

      protein

    };
  }

  // =========================
  // UPDATE DASHBOARD
  // =========================

  function updateDashboard() {

    const result =
      calculateCalories();

    if (!result) return;

    safeText(
      "#calorieTarget",
      `${result.calories} kcal`
    );

    safeText(
      "#proteinTarget",
      `${result.protein} g`
    );

    safeText(
      "#maintenanceCalories",
      `${result.maintenance} kcal`
    );

    safeText(
      "#bmrCalories",
      `${result.bmr} kcal`
    );

    safeText(
      "#ageDisplay",
      `${result.age} سنة`
    );

    userData.targets =
      result;

    saveLocalData();
  }

  // =========================
  // PROFILE FORM
  // =========================

  const profileForm =
    $("#profileForm");

  if (profileForm) {

    profileForm.addEventListener(
      "submit",
      (event) => {

        event.preventDefault();

        userData.name =
          $("#name")?.value?.trim() || "";

        userData.birthDate =
          $("#birthDate")?.value || "";

        userData.weight =
          getNumber("#weight");

        userData.height =
          getNumber("#height");

        userData.goal =
          $("#goal")?.value ||
          "maintain";

        userData.activity =
          $("#activityLevel")?.value ||
          "1.375";

        saveLocalData();

        updateDashboard();

        showMessage(
          "تم حفظ بياناتك وحساب هدفك اليومي بنجاح"
        );

      }
    );
  }

  // =========================
  // AUTO CALCULATION
  // =========================

  [
    "#weight",
    "#height",
    "#birthDate",
    "#goal",
    "#activityLevel"
  ].forEach((selector) => {

    const element =
      $(selector);

    if (!element) return;

    element.addEventListener(
      "input",
      updateDashboard
    );

    element.addEventListener(
      "change",
      updateDashboard
    );

  });

  // =========================
  // FOOD DATABASE
  // =========================

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
    }

  };

  // =========================
  // FOOD CALCULATOR
  // =========================

  function calculateFood(food, grams) {

    if (!food || grams <= 0) {
      return null;
    }

    return {

      calories:
        Math.round(
          food.calories *
          grams /
          100
        ),

      protein:
        Math.round(
          food.protein *
          grams /
          100
        )

    };
  }

  function detectFood(text) {

    const value =
      text.toLowerCase();

    if (
      value.includes("فراخ") ||
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

    return null;
  }

  // =========================
  // MEAL FORM
  // =========================

  const foodForm =
    $("#foodForm");

  if (foodForm) {

    foodForm.addEventListener(
      "submit",
      (event) => {

        event.preventDefault();

        const foodText =
          $("#foodName")
            ?.value
            ?.trim() || "";

        const grams =
          getNumber("#foodGrams");

        const food =
          detectFood(foodText);

        if (!food) {

          showMessage(
            "اكتب اسم اكل معروف مثل فراخ او رز او بيض"
          );

          return;
        }

        const result =
          calculateFood(
            food,
            grams
          );

        if (!result) {

          showMessage(
            "اكتب كمية صحيحة بالجرام"
          );

          return;
        }

        userData.today =
          userData.today || {};

        userData.today.calories =
          Number(
            userData.today.calories || 0
          ) +
          result.calories;

        userData.today.protein =
          Number(
            userData.today.protein || 0
          ) +
          result.protein;

        userData.today.meals =
          userData.today.meals || [];

        userData.today.meals.push({

          food:
            food.name,

          grams,

          calories:
            result.calories,

          protein:
            result.protein,

          time:
            new Date().toISOString()

        });

        saveLocalData();

        updateFoodDashboard();

        showMessage(
          `${food.name}: ${result.calories} kcal | ${result.protein}g protein`
        );

        foodForm.reset();

      }
    );
  }

  // =========================
  // FOOD DASHBOARD
  // =========================

  function updateFoodDashboard() {

    const today =
      userData.today || {};

    safeText(
      "#todayCalories",
      `${today.calories || 0} kcal`
    );

    safeText(
      "#todayProtein",
      `${today.protein || 0} g`
    );

    const result =
      calculateCalories();

    if (result) {

      const remaining =
        Math.max(
          0,
          result.calories -
          Number(
            today.calories || 0
          )
        );

      safeText(
        "#remainingCalories",
        `${remaining} kcal`
      );

    }
  }

  // =========================
  // QUICK FOOD BUTTONS
  // =========================

  $$(".food-btn").forEach(
    (button) => {

      button.addEventListener(
        "click",
        () => {

          const foodName =
            button.dataset.food ||
            button.textContent;

          const food =
            detectFood(foodName);

          if (!food) return;

          const grams =
            Number(
              button.dataset.grams ||
              100
            );

          const result =
            calculateFood(
              food,
              grams
            );

          if (!result) return;

          userData.today =
            userData.today || {};

          userData.today.calories =
            Number(
              userData.today.calories || 0
            ) +
            result.calories;

          userData.today.protein =
            Number(
              userData.today.protein || 0
            ) +
            result.protein;

          userData.today.meals =
            userData.today.meals || [];

          userData.today.meals.push({

            food:
              food.name,

            grams,

            calories:
              result.calories,

            protein:
              result.protein,

            time:
              new Date().toISOString()

          });

          saveLocalData();

          updateFoodDashboard();

          showMessage(
            `تم تسجيل ${food.name}`
          );

        }
      );

    }
  );

  // =========================
  // SLEEP
  // =========================

  const sleepStartBtn =
    $("#sleepStartBtn");

  const sleepEndBtn =
    $("#sleepEndBtn");

  if (sleepStartBtn) {

    sleepStartBtn.addEventListener(
      "click",
      () => {

        userData.sleepStart =
          new Date().toISOString();

        saveLocalData();

        showMessage(
          "تم تسجيل وقت النوم"
        );

        updateSleep();

      }
    );

  }

  if (sleepEndBtn) {

    sleepEndBtn.addEventListener(
      "click",
      () => {

        if (!userData.sleepStart) {

          showMessage(
            "سجل وقت النوم اولا"
          );

          return;
        }

        userData.sleepEnd =
          new Date().toISOString();

        saveLocalData();

        updateSleep();

        showMessage(
          "تم تسجيل وقت الاستيقاظ"
        );

      }
    );

  }

  function updateSleep() {

    if (
      !userData.sleepStart ||
      !userData.sleepEnd
    ) {
      return;
    }

    const start =
      new Date(
        userData.sleepStart
      );

    const end =
      new Date(
        userData.sleepEnd
      );

    const hours =
      (end - start) /
      (1000 * 60 * 60);

    if (hours >= 0) {

      safeText(
        "#sleepDuration",
        `${hours.toFixed(1)} ساعة`
      );

    }
  }

  // =========================
  // WATER
  // =========================

  let water =
    Number(
      localStorage.getItem(
        "dr_elorabi_water"
      ) || 0
    );

  function updateWater() {

    safeText(
      "#waterAmount",
      `${water} ml`
    );

    safeText(
      "#waterLiters",
      `${(
        water / 1000
      ).toFixed(1)} L`
    );

  }

  const waterBtn =
    $("#waterBtn");

  if (waterBtn) {

    waterBtn.addEventListener(
      "click",
      () => {

        water += 250;

        localStorage.setItem(
          "dr_elorabi_water",
          water
        );

        updateWater();

        showMessage(
          "تم تسجيل 250 مل ماء"
        );

      }
    );

  }

  // =========================
  // STEPS
  // =========================

  const stepsInput =
    $("#stepsInput");

  const saveStepsBtn =
    $("#saveStepsBtn");

  if (saveStepsBtn) {

    saveStepsBtn.addEventListener(
      "click",
      () => {

        const steps =
          Number(
            stepsInput?.value || 0
          );

        userData.steps =
          Math.max(
            0,
            steps
          );

        saveLocalData();

        safeText(
          "#stepsDisplay",
          `${userData.steps} خطوة`
        );

        showMessage(
          "تم تسجيل الخطوات"
        );

      }
    );

  }

  // =========================
  // WORKOUT
  // =========================

  $$(".workout-btn").forEach(
    (button) => {

      button.addEventListener(
        "click",
        () => {

          const workout =
            button.dataset.workout ||
            button.textContent;

          userData.workouts =
            userData.workouts || [];

          userData.workouts.push({

            name:
              workout,

            time:
              new Date().toISOString()

          });

          saveLocalData();

          showMessage(
            `تم تسجيل تمرين: ${workout}`
          );

        }
      );

    }
  );

  // =========================
  // DAILY PLAN
  // =========================

  function createDailyPlan() {

    const result =
      calculateCalories();

    if (!result) {

      showMessage(
        "اكمل بياناتك الاول علشان نعمل الخطة"
      );

      return;
    }

    const calories =
      result.calories;

    const breakfast =
      Math.round(
        calories * 0.25
      );

    const lunch =
      Math.round(
        calories * 0.35
      );

    const dinner =
      Math.round(
        calories * 0.25
      );

    const dessert =
      Math.round(
        calories * 0.10
      );

    const snack =
      Math.round(
        calories * 0.05
      );

    const plan = {

      breakfast,

      lunch,

      dinner,

      dessert,

      snack,

      protein:
        result.protein

    };

    userData.dailyPlan =
      plan;

    saveLocalData();

    safeText(
      "#breakfastCalories",
      `${breakfast} kcal`
    );

    safeText(
      "#lunchCalories",
      `${lunch} kcal`
    );

    safeText(
      "#dinnerCalories",
      `${dinner} kcal`
    );

    safeText(
      "#dessertCalories",
      `${dessert} kcal`
    );

    safeText(
      "#snackCalories",
      `${snack} kcal`
    );

    showMessage(
      "تم إنشاء خطة اليوم"
    );

  }

  const generatePlanBtn =
    $("#generatePlanBtn");

  if (generatePlanBtn) {

    generatePlanBtn.addEventListener(
      "click",
      createDailyPlan
    );

  }

  // =========================
  // BODY PROGRESS
  // =========================

  const progressForm =
    $("#progressForm");

  if (progressForm) {

    progressForm.addEventListener(
      "submit",
      (event) => {

        event.preventDefault();

        const weight =
          getNumber(
            "#progressWeight"
          );

        if (weight <= 0) {

          showMessage(
            "اكتب الوزن الحالي"
          );

          return;
        }

        userData.progress =
          userData.progress || [];

        userData.progress.push({

          weight,

          date:
            new Date().toISOString()

        });

        saveLocalData();

        showMessage(
          "تم تسجيل تقدمك"
        );

      }
    );

  }

  // =========================
  // PHOTO PROGRESS
  // =========================

  const photoInput =
    $("#progressPhoto");

  if (photoInput) {

    photoInput.addEventListener(
      "change",
      (event) => {

        const file =
          event.target.files?.[0];

        if (!file) return;

        const reader =
          new FileReader();

        reader.onload =
          () => {

            userData.progressPhoto =
              reader.result;

            saveLocalData();

            const preview =
              $("#progressPhotoPreview");

            if (preview) {

              preview.src =
                reader.result;

              preview.style.display =
                "block";

            }

            showMessage(
              "تم حفظ صورة التقدم على الجهاز"
            );

          };

        reader.readAsDataURL(file);

      }
    );

  }

  // =========================================================
  // PRO REQUEST
  // =========================================================

  const requestProBtn =
    $("#requestProBtn");

  const confirmPaymentBtn =
    $("#confirmPaymentBtn");

  const paymentScreenshot =
    $("#paymentScreenshot");

  if (requestProBtn) {

    requestProBtn.addEventListener(
      "click",
      async () => {

        const name =
          userData.name ||
          $("#name")?.value?.trim() ||
          "مستخدم";

        const paymentLink =
          "https://ipn.eg/S/ahmed-6163/instapay/4RLjXi";

        const message =
          `أهلا ${name} 👋\n\n` +
          `لتفعيل dr.elorabi PRO:\n\n` +
          `💰 قيمة الاشتراك: 50 جنيه\n\n` +
          `1️⃣ اضغط زر الدفع.\n` +
          `2️⃣ قم بتحويل 50 جنيه.\n` +
          `3️⃣ خذ Screenshot للتحويل.\n` +
          `4️⃣ ارفع صورة التحويل.\n` +
          `5️⃣ اضغط تأكيد الدفع.\n\n` +
          `سيتم مراجعة التحويل من الإدارة.`;

        safeText(
          "#proMessage",
          message
        );

        const paymentButton =
          $("#paymentLink");

        if (paymentButton) {

          paymentButton.href =
            paymentLink;

          paymentButton.style.display =
            "inline-block";

          paymentButton.textContent =
            "💳 ادفع 50 جنيه";

          paymentButton.target =
            "_blank";

        }

        if (paymentScreenshot) {

          paymentScreenshot.style.display =
            "block";

        }

        if (confirmPaymentBtn) {

          confirmPaymentBtn.style.display =
            "inline-block";

        }

        userData.proRequest =
          true;

        userData.proRequestedAt =
          new Date().toISOString();

        saveLocalData();

        showMessage(
          "تم تجهيز طلب PRO. ادفع ثم ارفع صورة التحويل."
        );

      }
    );

  }

  // =========================================================
  // PAYMENT CONFIRMATION
  // =========================================================

  if (confirmPaymentBtn) {

    confirmPaymentBtn.addEventListener(
      "click",
      async () => {

        try {

          // -------------------------
          // CHECK SUPABASE
          // -------------------------

          if (!supabaseClient) {

            showMessage(
              "Supabase غير متصل."
            );

            return;
          }

          // -------------------------
          // CHECK LOGIN
          // -------------------------

          const {
            data: userDataResponse,
            error: userError
          } =
            await supabaseClient.auth.getUser();

          if (
            userError ||
            !userDataResponse?.user
          ) {

            showMessage(
              "لازم تسجل دخول الأول."
            );

            return;
          }

          const user =
            userDataResponse.user;

          // -------------------------
          // CHECK FILE
          // -------------------------

          const file =
            paymentScreenshot?.files?.[0];

          if (!file) {

            showMessage(
              "ارفع صورة التحويل أولا."
            );

            return;
          }

          // -------------------------
          // CHECK IMAGE
          // -------------------------

          if (
            !file.type.startsWith(
              "image/"
            )
          ) {

            showMessage(
              "ارفع صورة فقط."
            );

            return;
          }

          // -------------------------
          // CHECK SIZE
          // -------------------------

          if (
            file.size >
            5 * 1024 * 1024
          ) {

            showMessage(
              "حجم الصورة يجب ألا يتجاوز 5MB."
            );

            return;
          }

          confirmPaymentBtn.disabled =
            true;

          confirmPaymentBtn.textContent =
            "جاري إرسال الطلب...";

          // -------------------------
          // FILE EXTENSION
          // -------------------------

          const extension =
            file.name
              .split(".")
              .pop() ||
            "jpg";

          // -------------------------
          // FILE PATH
          // -------------------------

          const filePath =
            `${user.id}/${Date.now()}.${extension}`;

          // -------------------------
          // UPLOAD IMAGE
          // -------------------------

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
                  cacheControl:
                    "3600",

                  upsert:
                    false
                }
              );

          if (uploadError) {

            console.error(
              "Upload error:",
              uploadError
            );

            showMessage(
              "حصل خطأ أثناء رفع صورة التحويل."
            );

            confirmPaymentBtn.disabled =
              false;

            confirmPaymentBtn.textContent =
              "تأكيد الدفع";

            return;
          }

          // -------------------------
          // GET IMAGE URL
          // -------------------------

          const {
            data: publicUrlData
          } =
            supabaseClient.storage
              .from(
                "payment-screenshots"
              )
              .getPublicUrl(
                filePath
              );

          const screenshotUrl =
            publicUrlData?.publicUrl ||
            filePath;

          // -------------------------
          // INSERT PAYMENT REQUEST
          // -------------------------

          const {
            error: insertError
          } =
            await supabaseClient
              .from(
                "payment_requests"
              )
              .insert({

                user_id:
                  user.id,

                amount:
                  50,

                payment_method:
                  "InstaPay",

                transaction_reference:
                  null,

                screenshot_url:
                  screenshotUrl,

                status:
                  "pending"

              });

          if (insertError) {

            console.error(
              "Database error:",
              insertError
            );

            showMessage(
              "تم رفع الصورة لكن لم يتم تسجيل طلب الدفع."
            );

            confirmPaymentBtn.disabled =
              false;

            confirmPaymentBtn.textContent =
              "تأكيد الدفع";

            return;
          }

          // -------------------------
          // SAVE LOCAL STATUS
          // -------------------------

          userData.paymentStatus =
            "pending";

          userData.paymentSubmittedAt =
            new Date().toISOString();

          saveLocalData();

          // -------------------------
          // SUCCESS MESSAGE
          // -------------------------

          safeText(
            "#proMessage",

            "✅ تم إرسال طلب الدفع بنجاح.\n\n" +
            "سيتم مراجعة التحويل من الإدارة، " +
            "وبعد الموافقة سيتم تفعيل PRO."
          );

          confirmPaymentBtn.textContent =
            "تم إرسال الطلب ✓";

          confirmPaymentBtn.disabled =
            true;

          showMessage(
            "تم إرسال طلب PRO للإدارة بنجاح."
          );

        } catch (error) {

          console.error(
            "Payment error:",
            error
          );

          showMessage(
            "حدث خطأ غير متوقع."
          );

          confirmPaymentBtn.disabled =
            false;

          confirmPaymentBtn.textContent =
            "تأكيد الدفع";

        }

      }
    );

  }

  // =========================
  // SUPABASE AUTH
  // =========================

  const signupForm =
    $("#signupForm");

  if (
    signupForm &&
    supabaseClient
  ) {

    signupForm.addEventListener(
      "submit",
      async (event) => {

        event.preventDefault();

        const email =
          $("#signupEmail")
            ?.value
            ?.trim();

        const password =
          $("#signupPassword")
            ?.value;

        if (!email || !password) {

          showMessage(
            "اكتب البريد وكلمة المرور"
          );

          return;
        }

        const {
          error
        } =
          await supabaseClient.auth.signUp({
            email,
            password
          });

        if (error) {

          console.error(error);

          showMessage(
            error.message
          );

          return;
        }

        showMessage(
          "تم إنشاء الحساب. راجع بريدك الإلكتروني إذا كان تأكيد البريد مفعلا."
        );

      }
    );

  }

  // =========================
  // LOGIN
  // =========================

  const loginForm =
    $("#loginForm");

  if (
    loginForm &&
    supabaseClient
  ) {

    loginForm.addEventListener(
      "submit",
      async (event) => {

        event.preventDefault();

        const email =
          $("#loginEmail")
            ?.value
            ?.trim();

        const password =
          $("#loginPassword")
            ?.value;

        if (!email || !password) {

          showMessage(
            "اكتب البريد وكلمة المرور"
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
            error.message
          );

          return;
        }

        showMessage(
          "تم تسجيل الدخول بنجاح"
        );

        await loadCurrentUser();

      }
    );

  }

  // =========================
  // LOGOUT
  // =========================

  const logoutBtn =
    $("#logoutBtn");

  if (
    logoutBtn &&
    supabaseClient
  ) {

    logoutBtn.addEventListener(
      "click",
      async () => {

        const {
          error
        } =
          await supabaseClient.auth
            .signOut();

        if (error) {

          showMessage(
            error.message
          );

          return;
        }

        showMessage(
          "تم تسجيل الخروج"
        );

      }
    );

  }

  // =========================
  // CURRENT USER
  // =========================

  async function loadCurrentUser() {

    if (!supabaseClient) return;

    try {

      const {
        data
      } =
        await supabaseClient.auth
          .getUser();

      const user =
        data?.user;

      if (!user) return;

      safeText(
        "#userEmail",
        user.email || ""
      );

    } catch (error) {

      console.error(
        "User loading error:",
        error
      );

    }

  }

  // =========================
  // REALTIME CLOCK
  // =========================

  function updateClock() {

    const now =
      new Date();

    const time =
      now.toLocaleTimeString(
        "ar-EG",
        {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        }
      );

    const date =
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
      "#liveClock",
      time
    );

    safeText(
      "#todayDate",
      date
    );

  }

  setInterval(
    updateClock,
    1000
  );

  // =========================
  // MEAL TIMER
  // =========================

  function getNextMealTime() {

    const wakeTime =
      userData.wakeTime;

    if (!wakeTime) return;

    const wake =
      new Date(wakeTime);

    const next =
      new Date(wake);

    next.setHours(
      next.getHours() + 3
    );

    safeText(
      "#nextMealTime",
      next.toLocaleTimeString(
        "ar-EG",
        {
          hour: "2-digit",
          minute: "2-digit"
        }
      )
    );

  }

  const wakeBtn =
    $("#wakeBtn");

  if (wakeBtn) {

    wakeBtn.addEventListener(
      "click",
      () => {

        userData.wakeTime =
          new Date().toISOString();

        saveLocalData();

        getNextMealTime();

        showMessage(
          "تم تسجيل وقت الاستيقاظ وبدأ حساب يومك من دلوقتي"
        );

      }
    );

  }

  // =========================
  // INITIAL LOAD
  // =========================

  function loadSavedData() {

    if (userData.name) {

      const name =
        $("#name");

      if (name) {
        name.value =
          userData.name;
      }

    }

    if (userData.birthDate) {

      const birth =
        $("#birthDate");

      if (birth) {
        birth.value =
          userData.birthDate;
      }

    }

    if (userData.weight) {

      const weight =
        $("#weight");

      if (weight) {
        weight.value =
          userData.weight;
      }

    }

    if (userData.height) {

      const height =
        $("#height");

      if (height) {
        height.value =
          userData.height;
      }

    }

    if (userData.goal) {

      const goal =
        $("#goal");

      if (goal) {
        goal.value =
          userData.goal;
      }

    }

    if (userData.activity) {

      const activity =
        $("#activityLevel");

      if (activity) {
        activity.value =
          userData.activity;
      }

    }

    updateDashboard();

    updateFoodDashboard();

    updateSleep();

    updateWater();

    if (userData.steps) {

      safeText(
        "#stepsDisplay",
        `${userData.steps} خطوة`
      );

    }

    if (userData.progressPhoto) {

      const preview =
        $("#progressPhotoPreview");

      if (preview) {

        preview.src =
          userData.progressPhoto;

        preview.style.display =
          "block";

      }

    }

    getNextMealTime();

    updateClock();

  }

  loadSavedData();

  loadCurrentUser();

  console.log(
    "dr.elorabi application loaded successfully."
  );

});

/* =========================================================
   dr.elorabi
   Personal Health, Fitness & Nutrition App
   SUPABASE CONNECTED VERSION
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  // =======================================================
  // SUPABASE
  // =======================================================

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
      console.error("Supabase initialization error:", error);
    }
  }

  // =======================================================
  // HELPERS
  // =======================================================

  const $ = (selector) =>
    document.querySelector(selector);

  const $$ = (selector) =>
    Array.from(document.querySelectorAll(selector));

  function showMessage(message) {
    let box = $("#appMessage");

    if (!box) {
      box = document.createElement("div");
      box.id = "appMessage";

      Object.assign(box.style, {
        position: "fixed",
        left: "20px",
        right: "20px",
        bottom: "20px",
        zIndex: "99999",
        padding: "15px",
        borderRadius: "14px",
        background: "#111827",
        color: "white",
        textAlign: "center",
        fontWeight: "600"
      });

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

  function todayDate() {
    return new Date().toISOString().split("T")[0];
  }

  // =======================================================
  // LOCAL CACHE
  // =======================================================

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

  // =======================================================
  // CURRENT AUTH USER
  // =======================================================

  let currentUser = null;

  async function getCurrentUser() {
    if (!supabaseClient) return null;

    try {
      const {
        data,
        error
      } = await supabaseClient.auth.getUser();

      if (error) {
        console.error(error);
        return null;
      }

      currentUser = data?.user || null;

      return currentUser;

    } catch (error) {
      console.error(error);
      return null;
    }
  }

  // =======================================================
  // AGE
  // =======================================================

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

  // =======================================================
  // CALORIE CALCULATOR
  // =======================================================

  function calculateCalories() {

    const weight =
      getNumber("#weight", 0);

    const height =
      getNumber("#height", 0);

    const birthDate =
      $("#birthDate")?.value || "";

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

    const activity =
      Number(
        $("#activityLevel")?.value ||
        1.375
      );

    const maintenance =
      bmr * activity;

    const goal =
      $("#goal")?.value ||
      "maintain";

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
      bmr: Math.round(bmr),
      maintenance:
        Math.round(maintenance),
      calories:
        Math.round(target),
      protein
    };
  }

  // =======================================================
  // DASHBOARD
  // =======================================================

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

  // =======================================================
  // SAVE PROFILE TO SUPABASE
  // =======================================================

  async function saveProfileToSupabase() {

    if (!supabaseClient) return;

    const user =
      currentUser ||
      await getCurrentUser();

    if (!user) {
      return;
    }

    const profile = {
      id: user.id,
      full_name:
        $("#name")?.value?.trim() ||
        userData.name ||
        "",
      birth_date:
        $("#birthDate")?.value ||
        userData.birthDate ||
        null,
      gender:
        $("input[name='gender']:checked")?.value ||
        null,
      height_cm:
        getNumber("#height", 0) || null,
      weight_kg:
        getNumber("#weight", 0) || null,
      goal:
        $("#goal")?.value ||
        "maintain",
      activity_level:
        $("#activityLevel")?.value ||
        null
    };

    const {
      error
    } =
      await supabaseClient
        .from("profiles")
        .upsert(
          profile,
          {
            onConflict: "id"
          }
        );

    if (error) {
      console.error(
        "Profile save error:",
        error
      );
    }
  }

  // =======================================================
  // PROFILE FORM
  // =======================================================

  const profileForm =
    $("#profileForm");

  if (profileForm) {

    profileForm.addEventListener(
      "submit",
      async (event) => {

        event.preventDefault();

        userData.name =
          $("#name")?.value?.trim() ||
          "";

        userData.birthDate =
          $("#birthDate")?.value ||
          "";

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

        await saveProfileToSupabase();

        showMessage(
          "تم حفظ بياناتك بنجاح"
        );
      }
    );
  }

  // =======================================================
  // AUTO CALCULATION
  // =======================================================

  [
    "#weight",
    "#height",
    "#birthDate",
    "#goal",
    "#activityLevel"
  ].forEach((selector) => {

    const element = $(selector);

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

  // =======================================================
  // FOOD DATABASE
  // =======================================================

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
    ) return foods.chicken;

    if (
      value.includes("رز") ||
      value.includes("أرز") ||
      value.includes("rice")
    ) return foods.rice;

    if (
      value.includes("بيض") ||
      value.includes("egg")
    ) return foods.eggs;

    if (
      value.includes("شوفان") ||
      value.includes("oat")
    ) return foods.oats;

    if (
      value.includes("موز") ||
      value.includes("banana")
    ) return foods.banana;

    if (
      value.includes("زبادي") ||
      value.includes("yogurt")
    ) return foods.yogurt;

    if (
      value.includes("تونة") ||
      value.includes("tuna")
    ) return foods.tuna;

    if (
      value.includes("بطاطس") ||
      value.includes("potato")
    ) return foods.potato;

    if (
      value.includes("عيش") ||
      value.includes("خبز") ||
      value.includes("bread")
    ) return foods.bread;

    if (
      value.includes("لبن") ||
      value.includes("milk")
    ) return foods.milk;

    return null;
  }

  // =======================================================
  // GET / CREATE DAILY LOG
  // =======================================================

  async function getDailyLog() {

    if (!supabaseClient) {
      return null;
    }

    const user =
      currentUser ||
      await getCurrentUser();

    if (!user) return null;

    const date =
      todayDate();

    const {
      data,
      error
    } =
      await supabaseClient
        .from("daily_logs")
        .select("*")
        .eq("user_id", user.id)
        .eq("log_date", date)
        .maybeSingle();

    if (error) {
      console.error(
        "Daily log error:",
        error
      );
      return null;
    }

    if (data) {
      return data;
    }

    const {
      data: created,
      error: createError
    } =
      await supabaseClient
        .from("daily_logs")
        .insert({
          user_id: user.id,
          log_date: date,
          calories_consumed: 0,
          protein_consumed: 0,
          water_ml: 0,
          calories_burned: 0
        })
        .select()
        .single();

    if (createError) {
      console.error(
        "Daily log creation error:",
        createError
      );
      return null;
    }

    return created;
  }

  // =======================================================
  // FOOD LOG
  // =======================================================

  async function saveFoodToSupabase(
    food,
    grams,
    result
  ) {

    if (!supabaseClient) return;

    const user =
      currentUser ||
      await getCurrentUser();

    if (!user) {
      showMessage(
        "سجل الدخول اولا لحفظ البيانات"
      );
      return;
    }

    const dailyLog =
      await getDailyLog();

    if (!dailyLog) return;

    const {
      error: foodError
    } =
      await supabaseClient
        .from("food_logs")
        .insert({
          user_id: user.id,
          daily_log_id: dailyLog.id,
          meal_type: "meal",
          meal_name: food.name,
          description:
            `${grams} جرام`,
          calories:
            result.calories,
          protein_g:
            result.protein,
          carbs_g: 0,
          fat_g: 0,
          consumed_at:
            new Date().toISOString()
        });

    if (foodError) {
      console.error(
        "Food log error:",
        foodError
      );
      return;
    }

    await supabaseClient
      .from("daily_logs")
      .update({
        calories_consumed:
          Number(
            dailyLog.calories_consumed || 0
          ) +
          result.calories,

        protein_consumed:
          Number(
            dailyLog.protein_consumed || 0
          ) +
          result.protein
      })
      .eq("id", dailyLog.id);
  }

  // =======================================================
  // FOOD FORM
  // =======================================================

  const foodForm =
    $("#foodForm");

  if (foodForm) {

    foodForm.addEventListener(
      "submit",
      async (event) => {

        event.preventDefault();

        const foodText =
          $("#foodName")?.value?.trim() ||
          "";

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
          food: food.name,
          grams,
          calories:
            result.calories,
          protein:
            result.protein,
          time:
            new Date().toISOString()
        });

        saveLocalData();

        await saveFoodToSupabase(
          food,
          grams,
          result
        );

        updateFoodDashboard();

        showMessage(
          `${food.name}: ${result.calories} kcal | ${result.protein}g protein`
        );

        foodForm.reset();
      }
    );
  }

  // =======================================================
  // FOOD DASHBOARD
  // =======================================================

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

  // =======================================================
  // QUICK FOOD BUTTONS
  // =======================================================

  $$(".food-btn").forEach(
    (button) => {

      button.addEventListener(
        "click",
        async () => {

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
            food: food.name,
            grams,
            calories:
              result.calories,
            protein:
              result.protein,
            time:
              new Date().toISOString()
          });

          saveLocalData();

          await saveFoodToSupabase(
            food,
            grams,
            result
          );

          updateFoodDashboard();

          showMessage(
            `تم تسجيل ${food.name}`
          );
        }
      );
    }
  );

  // =======================================================
  // WATER
  // =======================================================

  let water =
    Number(
      localStorage.getItem(
        "dr_elorabi_water"
      ) || 0
    );

  async function saveWaterToSupabase(
    amount
  ) {

    if (!supabaseClient) return;

    const user =
      currentUser ||
      await getCurrentUser();

    if (!user) return;

    const dailyLog =
      await getDailyLog();

    if (!dailyLog) return;

    await supabaseClient
      .from("water_logs")
      .insert({
        user_id: user.id,
        daily_log_id: dailyLog.id,
        amount_ml: amount,
        consumed_at:
          new Date().toISOString()
      });

    await supabaseClient
      .from("daily_logs")
      .update({
        water_ml:
          Number(
            dailyLog.water_ml || 0
          ) +
          amount
      })
      .eq(
        "id",
        dailyLog.id
      );
  }

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
      async () => {

        water += 250;

        localStorage.setItem(
          "dr_elorabi_water",
          water
        );

        await saveWaterToSupabase(
          250
        );

        updateWater();

        showMessage(
          "تم تسجيل 250 مل ماء"
        );
      }
    );
  }

  // =======================================================
  // SLEEP
  // =======================================================

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
      async () => {

        if (!userData.sleepStart) {

          showMessage(
            "سجل وقت النوم اولا"
          );

          return;
        }

        userData.sleepEnd =
          new Date().toISOString();

        saveLocalData();

        await saveSleepToSupabase();

        updateSleep();

        showMessage(
          "تم تسجيل وقت الاستيقاظ"
        );
      }
    );
  }

  async function saveSleepToSupabase() {

    if (!supabaseClient) return;

    const user =
      currentUser ||
      await getCurrentUser();

    if (!user) return;

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

    const sleepMinutes =
      Math.max(
        0,
        Math.round(
          (
            end - start
          ) / 60000
        )
      );

    const dailyLog =
      await getDailyLog();

    if (!dailyLog) return;

    await supabaseClient
      .from("daily_logs")
      .update({
        sleep_time:
          end.toISOString(),

        sleep_minutes:
          sleepMinutes
      })
      .eq(
        "id",
        dailyLog.id
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
      (
        end - start
      ) /
      (
        1000 * 60 * 60
      );

    if (hours >= 0) {

      safeText(
        "#sleepDuration",
        `${hours.toFixed(1)} ساعة`
      );
    }
  }

  // =======================================================
  // STEPS
  // =======================================================

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

  // =======================================================
  // WORKOUT
  // =======================================================

  $$(".workout-btn").forEach(
    (button) => {

      button.addEventListener(
        "click",
        async () => {

          const workout =
            button.dataset.workout ||
            button.textContent;

          userData.workouts =
            userData.workouts || [];

          userData.workouts.push({
            name: workout,
            time:
              new Date().toISOString()
          });

          saveLocalData();

          if (supabaseClient) {

            const user =
              currentUser ||
              await getCurrentUser();

            if (user) {

              const dailyLog =
                await getDailyLog();

              if (dailyLog) {

                await supabaseClient
                  .from("exercise_logs")
                  .insert({
                    user_id:
                      user.id,
                    daily_log_id:
                      dailyLog.id,
                    exercise_name:
                      workout,
                    duration_minutes:
                      0,
                    calories_burned:
                      0,
                    started_at:
                      new Date().toISOString()
                  });
              }
            }
          }

          showMessage(
            `تم تسجيل تمرين: ${workout}`
          );
        }
      );
    }
  );

  // =======================================================
  // DAILY PLAN
  // =======================================================

  async function createDailyPlan() {

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

    // Save main daily plan to Supabase
    if (supabaseClient) {

      const user =
        currentUser ||
        await getCurrentUser();

      if (user) {

        await supabaseClient
          .from("daily_plans")
          .insert([
            {
              user_id:
                user.id,
              plan_date:
                todayDate(),
              meal_type:
                "daily_plan",
              meal_name:
                "خطة اليوم",
              ingredients:
                "",
              instructions:
                "خطة غذائية محسوبة حسب احتياجات المستخدم",
              calories:
                calories,
              protein_g:
                result.protein,
              carbs_g:
                0,
              fat_g:
                0,
              completed:
                false
            }
          ]);
      }
    }

    showMessage(
      "تم إنشاء خطة اليوم وحفظها"
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

  // =======================================================
  // BODY PROGRESS
  // =======================================================

  const progressForm =
    $("#progressForm");

  if (progressForm) {

    progressForm.addEventListener(
      "submit",
      async (event) => {

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

        if (supabaseClient) {

          const user =
            currentUser ||
            await getCurrentUser();

          if (user) {

            const data = {
              user_id:
                user.id,
              weight_kg:
                weight,
              waist_cm:
                getNumber(
                  "#waist"
                ) || null,
              chest_cm:
                getNumber(
                  "#chest"
                ) || null,
              arm_cm:
                getNumber(
                  "#arm"
                ) || null,
              thigh_cm:
                getNumber(
                  "#thigh"
                ) || null,
              body_fat_percent:
                getNumber(
                  "#bodyFat"
                ) || null,
              notes:
                $("#progressNotes")
                  ?.value ||
                null,
              recorded_at:
                new Date().toISOString()
            };

            const {
              error
            } =
              await supabaseClient
                .from("progress_logs")
                .insert(data);

            if (error) {
              console.error(
                "Progress error:",
                error
              );
            }
          }
        }

        showMessage(
          "تم تسجيل تقدمك"
        );
      }
    );
  }

  // =======================================================
  // PROGRESS PHOTO
  // =======================================================

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

        reader.onload = () => {

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

  // =======================================================
  // PRO REQUEST
  // =======================================================

  const requestProBtn =
    $("#requestProBtn");

  if (requestProBtn) {

    requestProBtn.addEventListener(
      "click",
      async () => {

        const name =
          userData.name ||
          $("#name")?.value ||
          "مستخدم";

        const paymentLink =
          "https://ipn.eg/S/ahmed-6163/instapay/4RLjXi";

        const message =
          `أهلا ${name}،\n\n` +
          `لتفعيل dr.elorabi PRO، ` +
          `ادفع الاشتراك ثم احتفظ بصورة التحويل.\n\n` +
          `قيمة الاشتراك: 50 جنيه\n\n` +
          `بعد التحويل اضغط تأكيد الدفع.`;

        safeText(
          "#proMessage",
          message
        );

        userData.proRequest =
          true;

        userData.proRequestedAt =
          new Date().toISOString();

        saveLocalData();

        const paymentButton =
          $("#paymentLink");

        if (paymentButton) {

          paymentButton.href =
            paymentLink;

          paymentButton.style.display =
            "inline-block";
        }

        if (supabaseClient) {

          const user =
            currentUser ||
            await getCurrentUser();

          if (user) {

            const {
              error
            } =
              await supabaseClient
                .from("payment_requests")
                .insert({
                  user_id:
                    user.id,
                  amount:
                    50,
                  payment_method:
                    "instapay",
                  status:
                    "pending"
                });

            if (error) {
              console.error(
                "Payment request error:",
                error
              );
            }
          }
        }

        showMessage(
          "تم تجهيز طلب تفعيل PRO"
        );
      }
    );
  }

  // =======================================================
  // PAYMENT CONFIRMATION
  // =======================================================

  const confirmPaymentBtn =
    $("#confirmPaymentBtn");

  if (confirmPaymentBtn) {

    confirmPaymentBtn.addEventListener(
      "click",
      async () => {

        userData.paymentStatus =
          "pending";

        userData.paymentSubmittedAt =
          new Date().toISOString();

        saveLocalData();

        if (supabaseClient) {

          const user =
            currentUser ||
            await getCurrentUser();

          if (user) {

            const {
              error
            } =
              await supabaseClient
                .from("payment_requests")
                .insert({
                  user_id:
                    user.id,
                  amount:
                    50,
                  payment_method:
                    "instapay",
                  status:
                    "pending"
                });

            if (error) {
              console.error(
                error
              );
            }
          }
        }

        safeText(
          "#proMessage",
          "تم إرسال طلب الدفع للمراجعة. التفعيل النهائي يحتاج تأكيد الدفع من الإدارة."
        );

        showMessage(
          "تم إرسال طلب تفعيل PRO"
        );
      }
    );
  }

  // =======================================================
  // SIGN UP
  // =======================================================

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

        if (
          !email ||
          !password
        ) {

          showMessage(
            "اكتب البريد وكلمة المرور"
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

  // =======================================================
  // LOGIN
  // =======================================================

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

        if (
          !email ||
          !password
        ) {

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

        await getCurrentUser();

        await loadCurrentUser();

        showMessage(
          "تم تسجيل الدخول بنجاح"
        );
      }
    );
  }

  // =======================================================
  // LOGOUT
  // =======================================================

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

        currentUser =
          null;

        showMessage(
          "تم تسجيل الخروج"
        );
      }
    );
  }

  // =======================================================
  // LOAD PROFILE
  // =======================================================

  async function loadProfile() {

    if (!supabaseClient) return;

    const user =
      currentUser ||
      await getCurrentUser();

    if (!user) return;

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
      console.error(
        "Profile loading error:",
        error
      );
      return;
    }

    if (!data) return;

    if (data.full_name) {

      userData.name =
        data.full_name;

      if ($("#name")) {
        $("#name").value =
          data.full_name;
      }
    }

    if (data.birth_date) {

      userData.birthDate =
        data.birth_date;

      if ($("#birthDate")) {
        $("#birthDate").value =
          data.birth_date;
      }
    }

    if (data.height_cm) {

      userData.height =
        data.height_cm;

      if ($("#height")) {
        $("#height").value =
          data.height_cm;
      }
    }

    if (data.weight_kg) {

      userData.weight =
        data.weight_kg;

      if ($("#weight")) {
        $("#weight").value =
          data.weight_kg;
      }
    }

    if (data.goal) {

      userData.goal =
        data.goal;

      if ($("#goal")) {
        $("#goal").value =
          data.goal;
      }
    }

    if (data.activity_level) {

      userData.activity =
        data.activity_level;

      if ($("#activityLevel")) {
        $("#activityLevel").value =
          data.activity_level;
      }
    }

    saveLocalData();

    updateDashboard();
  }

  // =======================================================
  // CURRENT USER DISPLAY
  // =======================================================

  async function loadCurrentUser() {

    const user =
      currentUser ||
      await getCurrentUser();

    if (!user) return;

    safeText(
      "#userEmail",
      user.email || ""
    );

    await loadProfile();
  }

  // =======================================================
  // REALTIME CLOCK
  // =======================================================

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

  // =======================================================
  // MEAL TIMER
  // =======================================================

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
          "تم تسجيل وقت الاستيقاظ وبدأ حساب يومك"
        );
      }
    );
  }

  // =======================================================
  // LOAD SAVED LOCAL DATA
  // =======================================================

  function loadSavedData() {

    if (userData.name) {

      if ($("#name")) {
        $("#name").value =
          userData.name;
      }
    }

    if (userData.birthDate) {

      if ($("#birthDate")) {
        $("#birthDate").value =
          userData.birthDate;
      }
    }

    if (userData.weight) {

      if ($("#weight")) {
        $("#weight").value =
          userData.weight;
      }
    }

    if (userData.height) {

      if ($("#height")) {
        $("#height").value =
          userData.height;
      }
    }

    if (userData.goal) {

      if ($("#goal")) {
        $("#goal").value =
          userData.goal;
      }
    }

    if (userData.activity) {

      if ($("#activityLevel")) {
        $("#activityLevel").value =
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

  // =======================================================
  // AUTH STATE
  // =======================================================

  if (supabaseClient) {

    supabaseClient.auth
      .onAuthStateChange(
        async (
          event,
          session
        ) => {

          currentUser =
            session?.user || null;

          if (currentUser) {
            await loadCurrentUser();
          }
        }
      );
  }

  // =======================================================
  // START
  // =======================================================

  loadSavedData();

  getCurrentUser()
    .then(() => {
      loadCurrentUser();
    });

  console.log(
    "dr.elorabi Supabase application loaded successfully."
  );

});

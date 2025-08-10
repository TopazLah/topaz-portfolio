====================================================
JavaScript – דף עזר מקיף עם הסברים בעברית
====================================================

/* --------------------------------------------- */
/* הגדרת משתנים */
let x = 5;                     // משתנה רגיל שניתן לשנות
const name = "Topaz";         // משתנה קבוע שלא ניתן לשנות
var oldWay = 10;              // תחביר ישן, לא מומלץ כיום

/* --------------------------------------------- */
/* הדפסת מידע */
console.log("Hello World");   // הדפסת טקסט לקונסול (לבדיקה)

/* --------------------------------------------- */
/* פונקציות */
function sayHello() {
  console.log("Hi!");         // פונקציה פשוטה
}

function greetUser(name) {
  return "Hello " + name;     // מחזירה טקסט עם שם
}

let result = greetUser("Topaz"); // קריאה לפונקציה

/* --------------------------------------------- */
/* תנאים */
if (x > 10) {
  console.log("x גדול מ־10");
} else if (x === 10) {
  console.log("x שווה ל־10");
} else {
  console.log("x קטן מ־10");
}

/* --------------------------------------------- */
/* לולאות */
for (let i = 0; i < 5; i++) {
  console.log("i = " + i);    // ריצה 5 פעמים
}

let i = 0;
while (i < 5) {
  console.log(i);
  i++;
}

/* --------------------------------------------- */
/* מערכים */
let colors = ["red", "green", "blue"];
console.log(colors[0]);       // גישה לאיבר ראשון
colors.push("yellow");        // הוספת איבר לסוף
colors.pop();                 // הסרת איבר אחרון

/* --------------------------------------------- */
/* אובייקטים */
let person = {
  name: "Topaz",
  age: 25,
  isStudent: true
};

console.log(person.name);     // גישה לשדה באובייקט
person.age = 26;              // עדכון ערך

/* --------------------------------------------- */
/* עבודה עם HTML – DOM */
let title = document.getElementById("mainTitle");  // לפי ID
let boxes = document.querySelectorAll(".box");     // לפי class

/* שינוי טקסט */
title.innerText = "ברוך הבא!";

/* שינוי סגנון */
title.style.color = "blue";
title.style.fontSize = "32px";

/* --------------------------------------------- */
/* הוספת תגובה לאירוע */
let btn = document.getElementById("myButton");
btn.addEventListener("click", function() {
  alert("כפתור נלחץ!");
});

/* --------------------------------------------- */
/* תנאים מיוחדים */
let loggedIn = false;

if (!loggedIn) {
  console.log("משתמש לא מחובר");
}

/* --------------------------------------------- */
/* פונקציית חץ (Arrow Function) */
const multiply = (a, b) => {
  return a * b;
};

console.log(multiply(3, 4)); // תוצאה: 12

/* --------------------------------------------- */
/* טיפ: לבדוק אם אלמנט קיים לפני שימוש בו */
let box = document.querySelector(".box");
if (box) {
  box.style.border = "1px solid black";
}
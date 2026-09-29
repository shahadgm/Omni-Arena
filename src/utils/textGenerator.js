const englishParagraphs = [
  "The quick brown fox jumps over the lazy dog. It was a sunny afternoon when the fox decided to take a stroll through the dense forest. Along the way, he met several animals, including a wise old owl and a mischievous squirrel. They warned him about the cunning hunter who was known to frequent these woods, but the fox was confident in his speed.",
  "In a world driven by technology, it is easy to forget the simple pleasures of life. Taking a walk in the park, reading a physical book, or having a face-to-face conversation with a friend can bring immense joy. We must remember to disconnect from our screens and reconnect with the world around us. Balance is the key to a happy life.",
  "Space exploration has always fascinated humanity. The thought of traveling to distant planets and discovering new galaxies fills us with wonder. With recent advancements in aerospace engineering, missions to Mars are no longer just science fiction. Perhaps one day, we will establish colonies on other celestial bodies and truly become an interplanetary species.",
  "Cooking is both an art and a science. It requires precise measurements, an understanding of chemical reactions, and a creative touch to balance flavors. Whether you are baking a complex pastry or simply roasting vegetables, the process can be incredibly rewarding. The best part, of course, is sharing the delicious results with your loved ones.",
  "Music has a profound impact on our emotions and well-being. A cheerful melody can lift our spirits, while a somber tune can evoke feelings of nostalgia. Many people use music as a form of therapy, finding solace in the rhythm and lyrics. It is a universal language that transcends cultural boundaries and connects us all."
];

const arabicParagraphs = [
  "تعتبر اللغة العربية من أقدم اللغات وأكثرها ثراءً في العالم. تتميز بجمال خطوطها وعمق معانيها، مما يجعلها لغة فريدة من نوعها. يتحدث بها ملايين الأشخاص حول العالم، وتعتبر لغة رسمية في العديد من الدول. بالإضافة إلى ذلك، فهي لغة القرآن الكريم، مما يضفي عليها أهمية دينية وثقافية كبيرة.",
  "السفر يوسع الآفاق ويفتح العقل على ثقافات جديدة. عندما نزور بلدانًا مختلفة، نتعلم عن تاريخها وعادات وتقاليد شعوبها. تجربة أطعمة جديدة والتعرف على أشخاص من خلفيات متنوعة يمكن أن يغير نظرتنا للحياة. السفر ليس مجرد انتقال من مكان إلى آخر، بل هو رحلة لاكتشاف الذات.",
  "التكنولوجيا غيرت طريقة عيشنا وعملنا وتواصلنا. أصبحت الهواتف الذكية والإنترنت جزءًا لا يتجزأ من حياتنا اليومية. على الرغم من الفوائد العديدة التي تقدمها التكنولوجيا، إلا أن لها بعض الجوانب السلبية، مثل تقليل التفاعل الاجتماعي الحقيقي. من المهم أن نجد توازنًا في استخدامنا للتكنولوجيا.",
  "القراءة تعتبر نافذة على عوالم مختلفة. من خلال الكتب، يمكننا السفر عبر الزمن والمكان دون أن نغادر منازلنا. تساعد القراءة في تنمية الخيال وتحسين مهارات التفكير النقدي. كما أنها وسيلة رائعة للاسترخاء وتقليل التوتر بعد يوم طويل وشاق.",
  "الرياضة تلعب دورًا حيويًا في الحفاظ على الصحة البدنية والنفسية. ممارسة التمارين بانتظام تساعد في تقوية العضلات وتحسين الدورة الدموية. كما أنها تساهم في تقليل مستويات التوتر والقلق. يجب أن تكون الرياضة جزءًا من روتيننا اليومي لضمان حياة صحية وسعيدة."
];

const urduParagraphs = [
  "اردو زبان اپنی شیرینی اور نزاکت کے لیے مشہور ہے۔ یہ زبان برصغیر پاک و ہند کی تہذیب و ثقافت کا ایک اہم حصہ ہے۔ اردو میں شاعری، غزلیں اور نظمیں پڑھنے کا اپنا ہی ایک مزہ ہے۔ اس زبان نے کئی عظیم شاعروں اور ادیبوں کو جنم دیا ہے جنہوں نے ادب میں گراں قدر اضافہ کیا۔",
  "تعلیم کسی بھی معاشرے کی ترقی کے لیے بہت ضروری ہے۔ یہ انسان کو شعور بخشتی ہے اور اسے اچھے اور برے کی تمیز سکھاتی ہے۔ ایک تعلیم یافتہ معاشرہ ہی دنیا میں ترقی کر سکتا ہے اور اپنے مسائل کا حل تلاش کر سکتا ہے۔ ہمیں چاہیے کہ ہم تعلیم پر خاص توجہ دیں اور اپنے بچوں کو بہتر مستقبل فراہم کریں۔",
  "کتابیں انسان کی بہترین دوست ہوتی ہیں۔ تنہائی میں کتابیں ہمارا ساتھ دیتی ہیں اور ہماری معلومات میں اضافہ کرتی ہیں۔ مختلف موضوعات پر کتابیں پڑھنے سے ہمارے ذہن کی وسعت بڑھتی ہے اور ہم دنیا کو بہتر انداز میں سمجھ سکتے ہیں۔ مطالعے کی عادت اپنانا ایک بہت اچھی بات ہے۔",
  "وقت کی پابندی کامیابی کی کنجی ہے۔ جو لوگ وقت کی قدر کرتے ہیں، وہ زندگی کے ہر میدان میں کامیاب ہوتے ہیں۔ ہمیں چاہیے کہ ہم اپنے روزمرہ کے کاموں کا ایک شیڈول بنائیں اور اس پر عمل کریں۔ وقت ایک بار گزر جائے تو واپس نہیں آتا، اس لیے اس کا صحیح استعمال کرنا چاہیے۔",
  "قدرتی مناظر انسان کو سکون اور خوشی بخشتے ہیں۔ سرسبز پہاڑ، بہتے ہوئے دریا اور خوبصورت پرندے قدرت کی عظیم نشانیاں ہیں۔ ہمیں چاہیے کہ ہم اپنے ماحول کی حفاظت کریں اور اسے آلودگی سے بچائیں۔ قدرت کے قریب رہنے سے ہماری ذہنی اور جسمانی صحت بہتر ہوتی ہے۔"
];

export const generateText = (language) => {
  let dictionary = englishParagraphs;
  if (language === 'Arabic') dictionary = arabicParagraphs;
  if (language === 'Urdu') dictionary = urduParagraphs;

  const randomIdx = Math.floor(Math.random() * dictionary.length);
  return dictionary[randomIdx];
};

export const generateCompetitionText = (type) => {
  if (type === 'English') {
    return [{ language: 'English', text: generateText('English'), dir: 'ltr' }];
  } else if (type === 'Bilingual') {
    return [
      { language: 'English', text: generateText('English'), dir: 'ltr' },
      { language: 'Arabic', text: generateText('Arabic'), dir: 'rtl' }
    ];
  } else if (type === 'Trilingual') {
    return [
      { language: 'English', text: generateText('English'), dir: 'ltr' },
      { language: 'Arabic', text: generateText('Arabic'), dir: 'rtl' },
      { language: 'Urdu', text: generateText('Urdu'), dir: 'rtl' }
    ];
  } else if (type === 'Arabic') {
    return [{ language: 'Arabic', text: generateText('Arabic'), dir: 'rtl' }];
  } else if (type === 'Urdu') {
    return [{ language: 'Urdu', text: generateText('Urdu'), dir: 'rtl' }];
  }
  return [{ language: 'English', text: generateText('English'), dir: 'ltr' }];
};

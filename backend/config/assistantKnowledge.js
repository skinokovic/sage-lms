// What the assistant is allowed to say about SAGE itself.
//
// IMPORTANT: edit this file so it matches your real policies. The assistant is
// told to use ONLY these facts (plus the live course catalogue) and to say
// "I don't have that information" for anything else. Anything you add here, it
// will repeat to visitors, so only add things that are true.

export const SITE_FACTS = `
ABOUT SAGE
- SAGE School of Business & Management is an online learning platform for working professionals. Courses are practical, career-focused and taught by experienced instructors.
- Visitors can browse courses and see prices without an account. An account is needed to enrol and track progress.

ENROLLING AND PAYING
- Open a course, then either add it to the cart and check out (paid courses) or use "Enroll for free" (free courses).
- Prices are in Nigerian naira (₦). Paid courses can be paid online at checkout or by bank transfer. Bank transfers are confirmed by the SAGE team before the course is unlocked, so they take a little longer.
- Each course is bought separately; there is no subscription.
- Course pages state that students get lifetime access to a course they enrol in.

LEARNING
- After enrolling, students learn from their dashboard: video and text lessons, assignments, grades and progress tracking. Some instructors schedule live classes.
- Students can learn at their own pace on any device.

CERTIFICATES
- Students who complete a course can download a certificate from their dashboard.
- Anyone can check that a certificate is genuine on the Verify page using its certificate code.

INSTRUCTORS
- Experts can apply to teach by creating an account and submitting an instructor application. The SAGE team reviews every application. Approved instructors can build and publish courses.

HELP
- For account, payment or enrolment problems, visitors should use the Contact page. Forgotten passwords can be reset from the login page.

NOT KNOWN (say you don't have this information and point to the Contact page):
- refunds, discounts, coupons or instalment plans; accreditation or the official recognition of certificates; job placement or guarantees; exact start dates; anything about a specific person's account, payment or grades.
`.trim();

// The only pages the assistant may link to (besides individual course pages).
export const SITE_LINKS = `
- [All courses](/courses)
- [Pricing](/pricing)
- [FAQs](/faq)
- [Contact us](/contact)
- [About](/about)
- [Our instructors](/instructors)
- [Become an instructor](/become-instructor)
- [Create an account](/create-account)
- [Log in](/login)
- [Verify a certificate](/verify)
`.trim();

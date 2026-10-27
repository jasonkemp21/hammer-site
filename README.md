# Hammer Boxing & Fitness website

The live site for hammerfitnessandboxing.com. GitHub Pages publishes it from the `docs/` folder.

| Folder | What it holds |
|---|---|
| `docs/` | The built website. This is what visitors see. |
| `docs/admin/` | The staff page for website requests: `hammerfitnessandboxing.com/admin/` |
| `docs/config.js` | Where the Supabase settings go |
| `src/` | The source. Gym facts (hours, prices, classes, coaches, shop) are in `src/js/00-data.js` |
| `setup/supabase-setup.sql` | The one-time database setup |
| `images/`, `static/`, `assets/` | Photos, fixed files and icons the build copies in |

How the site works:

- **Book** buttons open the gym's Mindbody schedule on the class date. **Buy** buttons open the Mindbody online store. Bookings, accounts and payments stay in Mindbody.
- **Forms** (contact, private sessions, Kids Boxing, competing) save to Supabase. Staff read them at `/admin/`. If Supabase is down or not set up, the form tells the visitor to call or email instead. It never claims a message was sent when it wasn't.
- **The shop** is a catalog. Everything in it is sold at the front desk.

---

## 0. Confirm with the gym before launch

These come from the old site, which disagreed with itself in places. Fix them in `src/js/00-data.js`, then rebuild (see section 5).

1. **Hours.** The site uses Mon–Fri 6 AM–8 PM, Sat 8 AM–2 PM, Sunday closed. The old site also listed Mon–Thu 6 AM–9 PM with Fri 6 AM–7 PM, and a third set in its search data.
2. **Kids Boxing.** The coach, age range and price aren't set yet. Until they are, it shows "Ask the desk".
3. **Weekly schedule.** It's typed into `WEEK` in `00-data.js`. It doesn't read Mindbody, so update it when classes or coaches change. Mindbody calls the noon class "Hammer Hip House Boxing", while the site says "Lunch-Time Boxing".
4. **Pass names and prices.** Mindbody's store uses names like "Boxing Classes (Without G.A)" and "Group Class + G.A". The site uses the old website's names, such as Group Boxing Unlimited and Boxing + General Access. Check the prices match, and check that the 3-for-$30 intro offer can be bought on Mindbody.
5. **Offers.** Check that 3 classes for $30, 25% off packages for first-timers, and 10% off personal training packages are all still running.
6. **The Squarespace store.** The old site sells sessions and memberships through Squarespace's "Purchase Now" pages and store. Those stop working when the domain moves. Before switching, have the gym check Squarespace for active subscriptions or open orders, and move anything it sells online into Mindbody.
7. **Walk times** on the Visit page (about 4 minutes to Sedgwick, 8 to North/Clybourn) are estimates from a map. Adjust them if they're wrong.
8. **Privacy policy** (`#privacy`). It's a plain-language draft that describes what this site does. Have the owners read it.
9. **Shop.** Check the sizes, colors and prices that are still in stock.

---

## 1. Supabase: the database behind the forms and /admin (about 10 minutes)

1. Create a free account at supabase.com and a **new project**. Region: US East or US Central.
2. Open **SQL Editor → New query**. Paste in `setup/supabase-setup.sql`, then change the staff email near the top to the gym's real one(s). Click **Run**.
3. Add staff logins. Go to **Authentication → Users → Add user → Create new user**. Enter each staff member's email and a password, and tick auto-confirm. Every staff email must also be in the `admins` list from step 2. To add someone later, run:
   ```sql
   insert into public.admins (email) values ('name@example.com');
   ```
4. Turn off public sign-ups: **Authentication → Sign In / Providers → Allow new users to sign up: off**. The staff list protects the data even if sign-ups are left on, but switching them off is cleaner.
5. Get the keys from **Project Settings → API** (on newer dashboards, **API Keys**): the **Project URL** and the **anon / publishable** key. Paste both into `docs/config.js`. Never use the `service_role` or secret key.

On the free plan, Supabase may pause a project that has had no activity for a while. Check their current terms. If it pauses, forms show the phone and email until you restore it from the dashboard.

## 2. GitHub Pages

1. On github.com, create a **new public repository**, for example `hammer-site`.
2. Upload this whole folder's contents: `docs`, `src`, `setup`, `images`, `static`, `assets`, `build.mjs` and `README.md`. You can drag them into **Add file → Upload files**, or use git:
   ```
   git init -b main && git add . && git commit -m "Hammer site"
   git remote add origin https://github.com/jasonkemp21/hammer-site.git && git push -u origin main
   ```
3. Go to **Settings → Pages → Build and deployment**. Set Source to **Deploy from a branch**, branch **main**, folder **/docs**, then Save.
4. Check it at `https://jasonkemp21.github.io/hammer-site/` before touching the domain. Old-address forwarding only works on the real domain.

## 3. GoDaddy: point the domain at GitHub

Do this when you're ready to switch. The old Squarespace site goes dark for anyone whose browser picks up the change.

1. **Add the domain on GitHub first.** In **Settings → Pages → Custom domain**, enter `www.hammerfitnessandboxing.com` and click Save. GitHub saves it as `docs/CNAME`, and `node build.mjs` keeps that file. Until then the site previews at `jasonkemp21.github.io/hammer-site/`. GitHub warns that setting DNS before this step lets someone else claim the domain. GitHub also recommends verifying the domain under your account's **Settings → Pages → Add a domain**.
2. In GoDaddy, open the domain's **DNS** page. If the nameservers aren't GoDaddy's, the DNS is managed elsewhere (possibly Squarespace), so make the changes there instead.
3. Change only these records:

   | Type | Name | Value |
   |---|---|---|
   | A | @ | 185.199.108.153 |
   | A | @ | 185.199.109.153 |
   | A | @ | 185.199.110.153 |
   | A | @ | 185.199.111.153 |
   | CNAME | www | jasonkemp21.github.io |

   Delete the existing `@` A records and the `www` CNAME that point to Squarespace. Optionally, add AAAA records for `@`: `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153` and `2606:50c0:8003::153`.
4. **Don't touch MX, TXT or any other records.** They run the gym's email (info@…). Don't add a wildcard (`*`) record.
5. Changes can take up to 24 hours to spread. When the GitHub Pages screen shows the DNS check passed, tick **Enforce HTTPS**. That option can also take up to a day to appear.

## 4. After the switch

- Open `https://www.hammerfitnessandboxing.com` and `https://hammerfitnessandboxing.com` (the second should redirect to `www`).
- Try `/boxing-classes`, `/our-team` and `/privacy-policy`. Each should land on its new page.
- Send one real message from the Visit page and check it appears at `/admin/`. Mark it handled.
- Click Book and Buy once each.
- Update the website link on the Google Business Profile, Instagram, Facebook and ClassPass if needed. In Mindbody's settings, check that the "Our website" link points to the new site.
- Add the site to Google Search Console and submit `https://www.hammerfitnessandboxing.com/sitemap.xml`.
- Keep the Squarespace plan until point 6 in section 0 is settled. Then cancel it.

## 5. Making changes

Edit `src/` (most edits are in `src/js/00-data.js`), then run:

```
node build.mjs
```

This rebuilds `docs/` and keeps the Supabase settings already in `docs/config.js`. Commit and push, and Pages updates in about a minute. Node 18 or newer, no installs needed.

To test the build: `node test/live-site.mjs` runs 43 checks against stand-ins for Supabase and Mindbody. It needs Playwright.

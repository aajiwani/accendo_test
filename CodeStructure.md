# Code Structure

You may find this solution easy to navigate with this guide

- [app.js](./src/app.js) is where it all begins. It is the root of the JavaScript project for this API
- [src/routes/index.js](./src/routes/index.js) is where all the routes are located.
- [src/routes/accendo.js](./src/routes/accendo.js) is the place of interest for this project and Accendo functionlities.
- [src/utils](./src/utils/) is where most of the smaller chunks that makes the whole, resides.

### src/routes/accendo.js

1. `router.get("/org-chart/:org_id", async function (req, res) {` Refers to line 60
    - This is where Get Organization Chart API resides
2. `router.post("/org-chart", upload.single("org_chart"),` Refers to line 88
    - This is where Creating a new Organization Chart API resides
3. `router.put("/org-chart/:id", upload.single("org_chart"),` Refers to line 178
    - This is where Modification of Organization Chart API resides
  
### Database Model
> Database model for handling the use-case could be found [./src/database/accendo.js](./src/database/accendo.js)

---
**Note:** Please bear in mind, this is not an extensive guide, just a place to begin your journey.

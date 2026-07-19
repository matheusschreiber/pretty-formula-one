# Pretty Formula One

A fan-made website to see telemtry in a easy manner. Telemetry is seen in a graphical way and with near-zero delay or loading screens.

## General

The project is rather simple, it needs a frontend and a source of data to serve the `.json` and `.csv` files. The main problem here is the approach selected to display these values.

The priority here is the low cost and low maintenance, so in order to do that I had some different attempts.

### Database infrastructure

In order to achieve the goals for the project, I tried different types and archtectures to host the database of the application (raw telemetry files and championship data).

1. Local Files

To reach low response times and low maintenance cost, the first solution is to do all locally. Initially, telemetry data was stored as static JSON/CSV files within the repository.

- Pros: Zero latency for data retrieval; no external dependencies; $0 cost.

- Cons: High Space Consumption. Git repositories bloat quickly with large text data, making the project difficult to manage/clone and deploy on hosting platforms.

2. Serverless Functions

I attempted to process and serve data through Vercel's serverless functions on demand. And a side free database service as MongoDB Atlas. This was possible because at of right now the amount of data to be stored is not that big (less than 1GB).

Pros: Dynamic data handling; keeps the repository "thin".

Cons: Processing large telemetry packets often takes 5-10s which leads to poor user experience; Number of access in order to keep the connection "warm" was an overhead and would quickly reach the MongoDB atlas limit of requests per day.

3. External API with Paywall

I considered as a final alternative a robust backend with Django or NestJS to actively communicate with a dedicated database server. However that would cost a bit more (even tho I could charge users to pay the bills). The initial idea was to keep the telemetry of some famous drivers like Max Verstappen behind a paywall.

Pros: Professional-grade reliability; handles massive datasets; monetization ready.

Cons: High Infrastructure Complexity; Moving away from the "low maintenance" goal. Managing a dedicated database, authentication, and a paywall requires significant time investment.

4. Vercel Blob

This architecture leverages Vercel Blob for specialized object storage. Basically, Vercel offers a Storage service (like a S3 bucket) up to 1GB on free tiers which is currently enough for the size of the project. Each season of telemetry data weights approximately ~50MB. However the problem here was the amount of operations allowed each month, which was around 2,000 for complex operations (update/creation/list).

Pros: Extremely Fast; High-speed edge delivery ensures the track map and telemetry graphs feel responsive; It bridges the gap between static files and a full database.

Cons: Storage Ceiling for free tier; Limit on the number of operations (upload/deletion/etc).

5. AWS S3

Finally, tried the S3 Bucket approach which proved to be the best fit for the project as it has fast response times and cheap maintenance.

Pros: Extremely Fast; Cheap (0,023 USD per GB on first 50 TB/Month)

Cons: Storage Ceiling for free tier.

## Data pipeline

Season data (round results, tyre strategies, and per-driver fastest-lap telemetry) is kept in sync with S3 by a small Python job under [scripts/](scripts/). See [scripts/README.md](scripts/README.md) for how `automation.py` works, how to configure it, and how to run it locally or via Docker.

## Screenshots

![alt text](readme_media/pic1.png)

![alt text](readme_media/pic2.png)
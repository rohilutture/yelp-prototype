const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, PageNumber, Header, Footer,
  BorderStyle, WidthType, ShadingType, LevelFormat, TableOfContents,
  PageBreak
} = require('docx');
const fs = require('fs');

const BLUE = "2E75B6";
const DARK = "1F2937";
const GRAY = "6B7280";
const LIGHT_BLUE = "DBEAFE";
const LIGHT_GRAY = "F3F4F6";
const WHITE = "FFFFFF";

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 120 },
    children: [new TextRun({ text, bold: true, size: 32, color: BLUE, font: "Arial" })]
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 80 },
    children: [new TextRun({ text, bold: true, size: 26, color: DARK, font: "Arial" })]
  });
}

function p(text, opts = {}) {
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text, size: 22, font: "Arial", color: DARK, ...opts })]
  });
}

function placeholder(text) {
  return new Paragraph({
    spacing: { before: 120, after: 120 },
    border: { top: border, bottom: border, left: border, right: border },
    shading: { fill: "FEF3C7", type: ShadingType.CLEAR },
    children: [new TextRun({ text: `[ SCREENSHOT: ${text} ]`, size: 22, font: "Arial", color: "92400E", italics: true, bold: true })]
  });
}

function bullet(text) {
  return new Paragraph({
    spacing: { before: 40, after: 40 },
    numbering: { reference: "bullets", level: 0 },
    children: [new TextRun({ text, size: 22, font: "Arial", color: DARK })]
  });
}

function numbered(text) {
  return new Paragraph({
    spacing: { before: 40, after: 40 },
    numbering: { reference: "numbers", level: 0 },
    children: [new TextRun({ text, size: 22, font: "Arial", color: DARK })]
  });
}

function spacer() {
  return new Paragraph({ spacing: { before: 60, after: 60 }, children: [new TextRun("")] });
}

function makeTable(headers, rows, colWidths) {
  const totalWidth = colWidths.reduce((a, b) => a + b, 0);
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) => new TableCell({
      borders,
      width: { size: colWidths[i], type: WidthType.DXA },
      shading: { fill: BLUE, type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 20, color: WHITE, font: "Arial" })] })]
    }))
  });

  const dataRows = rows.map((row, ri) => new TableRow({
    children: row.map((cell, i) => new TableCell({
      borders,
      width: { size: colWidths[i], type: WidthType.DXA },
      shading: { fill: ri % 2 === 0 ? WHITE : LIGHT_GRAY, type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [new Paragraph({ children: [new TextRun({ text: cell, size: 20, font: "Arial", color: DARK })] })]
    }))
  }));

  return new Table({
    width: { size: totalWidth, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [headerRow, ...dataRows]
  });
}

const doc = new Document({
  numbering: {
    config: [
      { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbers", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ]
  },
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Arial", color: BLUE },
        paragraph: { spacing: { before: 360, after: 120 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Arial", color: DARK },
        paragraph: { spacing: { before: 240, after: 80 }, outlineLevel: 1 } },
    ]
  },
  sections: [
    // ── COVER PAGE ──────────────────────────────────────────────
    {
      properties: {
        page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } }
      },
      children: [
        spacer(), spacer(), spacer(), spacer(),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 480, after: 120 },
          children: [new TextRun({ text: "Lab 2 Report", bold: true, size: 56, font: "Arial", color: BLUE })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 120, after: 240 },
          children: [new TextRun({ text: "Yelp Prototype", bold: true, size: 40, font: "Arial", color: DARK })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 480 },
          children: [new TextRun({ text: "Microservices Architecture with MongoDB, Apache Kafka, Redux, and AWS Deployment", size: 26, font: "Arial", color: GRAY, italics: true })]
        }),
        spacer(), spacer(),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 120, after: 60 },
          children: [new TextRun({ text: "Student: Rohil", size: 26, font: "Arial", color: DARK, bold: true })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 60, after: 60 },
          children: [new TextRun({ text: "Course: Cloud Computing / Distributed Systems", size: 24, font: "Arial", color: GRAY })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 60, after: 60 },
          children: [new TextRun({ text: "Date: April 26, 2026", size: 24, font: "Arial", color: GRAY })]
        }),
        new Paragraph({ children: [new PageBreak()] }),
      ]
    },
    // ── MAIN CONTENT ─────────────────────────────────────────────
    {
      properties: {
        page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } }
      },
      headers: {
        default: new Header({ children: [new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BLUE, space: 1 } },
          children: [
            new TextRun({ text: "Lab 2 Report — Yelp Prototype", size: 18, font: "Arial", color: GRAY }),
            new TextRun({ text: "\t", size: 18 }),
            new TextRun({ text: "Rohil", size: 18, font: "Arial", color: GRAY }),
          ],
          tabStops: [{ type: "right", position: 9360 }]
        })] })
      },
      footers: {
        default: new Footer({ children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "Page ", size: 18, font: "Arial", color: GRAY }),
            new TextRun({ children: [PageNumber.CURRENT], size: 18, font: "Arial", color: GRAY }),
            new TextRun({ text: " of ", size: 18, font: "Arial", color: GRAY }),
            new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, font: "Arial", color: GRAY }),
          ]
        })] })
      },
      children: [
        // TOC
        h1("Table of Contents"),
        new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-2" }),
        new Paragraph({ children: [new PageBreak()] }),

        // Section 1
        h1("1. System Overview"),
        p("The Yelp Prototype is a full-stack restaurant review application built on a microservices architecture. All data is stored in MongoDB (PyMongo), events are streamed through Apache Kafka, the frontend uses React with Redux Toolkit for state management, and the entire stack is containerised with Docker Compose and deployable to AWS EC2 and Kubernetes (EKS)."),
        spacer(),
        p("Key technologies:", { bold: true }),
        bullet("Backend: FastAPI (Python) — 4 microservices + 3 async workers"),
        bullet("Database: MongoDB 7 (PyMongo — no ORM)"),
        bullet("Message broker: Apache Kafka + Zookeeper (Confluent 7.6.1)"),
        bullet("Frontend: React 18, Redux Toolkit, Vite, Tailwind CSS"),
        bullet("Infrastructure: Docker Compose, Nginx reverse proxy, AWS EC2 (t3.medium), Kubernetes manifest (k8s/lab2-stack.yaml)"),
        spacer(),

        // Section 2
        h1("2. MongoDB Schema Design"),
        p("MongoDB was chosen as the primary database, replacing the original MySQL/SQLAlchemy implementation. All collections use PyMongo directly with no ORM layer."),
        spacer(),
        h2("2.1 Collections"),
        spacer(),
        makeTable(
          ["Collection", "Key Fields", "Indexes", "Notes"],
          [
            ["users", "_id (ObjectId), name, email, hashed_password, role, avatar_url, created_at", "Unique index on email", "Replaces users SQL table"],
            ["restaurants", "_id (ObjectId), name, cuisine_type, address, city, avg_rating, review_count, view_count, price_range, photos[], owner_id", "None additional", "avg_rating updated synchronously on each review write"],
            ["reviews", "_id (ObjectId), restaurant_id (string), user_id (string), rating, comment, photos[], created_at", "Compound unique on (restaurant_id, user_id)", "Prevents duplicate reviews per user"],
            ["favourites", "_id (ObjectId), user_id (string), restaurant_id (string), created_at", "Compound unique on (user_id, restaurant_id)", "Toggle pattern — insert or delete"],
            ["sessions", "_id (ObjectId), token, user_id, role, created_at, expires_at, is_active", "TTL index on expires_at", "Auto-expire tokens"],
          ],
          [1500, 3200, 2200, 2460]
        ),
        spacer(),
        h2("2.2 Key Design Decisions"),
        numbered("ObjectId strings as IDs: All IDs are MongoDB ObjectIds stored as strings in the API layer, replacing integer auto-increment PKs. The helper function to_oid() converts string IDs back to ObjectId for queries."),
        numbered("Denormalised avg_rating: Rather than joining reviews at query time, avg_rating and review_count are stored directly on the restaurant document and recalculated synchronously on every create/update/delete using the _recalc_rating() function."),
        numbered("No ORM: PyMongo is used directly throughout. SQLAlchemy, Alembic, and PyMySQL were removed from requirements.txt, giving full control over document shape."),
        numbered("Hybrid write pattern for reviews: Reviews are written directly to MongoDB first (for immediate visibility), then a Kafka event is published for asynchronous side-effect processing by workers."),
        spacer(),

        // Section 3
        h1("3. Microservices Architecture"),
        h2("3.1 Service Breakdown"),
        spacer(),
        makeTable(
          ["Service", "Port", "Responsibilities"],
          [
            ["user-service", "8001", "Signup, login, profile management, JWT token issuance, session persistence"],
            ["owner-service", "8002", "Owner dashboard, restaurant management, photo uploads"],
            ["restaurant-service", "8003", "Restaurant CRUD, search, filtering by cuisine/price, view count tracking"],
            ["review-service", "8004", "Review CRUD, rating recalculation, Kafka event publishing"],
            ["review-worker", "—", "Kafka consumer for review.created / review.updated / review.deleted"],
            ["user-worker", "—", "Kafka consumer for user.created events"],
            ["restaurant-worker", "—", "Kafka consumer for restaurant events"],
          ],
          [2000, 1000, 6360]
        ),
        spacer(),
        h2("3.2 Nginx Reverse Proxy"),
        p("All services sit behind a single Nginx reverse proxy. The frontend is served on port 5173 and all API calls use the /api/* path prefix which Nginx routes to the appropriate backend service:"),
        bullet("/api/auth/* → user-service:8001"),
        bullet("/api/owner/* → owner-service:8002"),
        bullet("/api/restaurants/* → restaurant-service:8003"),
        bullet("/api/reviews/* → review-service:8004"),
        spacer(),
        placeholder("Architecture Diagram — insert architecture-diagram.html screenshot here"),
        spacer(),

        // Section 4
        h1("4. Apache Kafka Integration"),
        h2("4.1 Producer/Consumer Pattern"),
        p("Kafka is used as the asynchronous event bus between microservices and worker processes. The following topics are defined:"),
        spacer(),
        makeTable(
          ["Topic", "Producer", "Consumer"],
          [
            ["review.created", "review-service", "review-worker (recalculates avg_rating)"],
            ["review.updated", "review-service", "review-worker (recalculates avg_rating)"],
            ["review.deleted", "review-service", "review-worker (recalculates avg_rating)"],
            ["user.created", "user-service", "user-worker (user lifecycle events)"],
          ],
          [2500, 2500, 4360]
        ),
        spacer(),
        h2("4.2 Hybrid Write Pattern"),
        p("To avoid race conditions between immediate API responses and asynchronous Kafka processing, a hybrid write pattern is used for review operations:"),
        numbered("The review-service writes the review document directly to MongoDB (synchronous). This ensures the review is immediately visible when the client re-fetches."),
        numbered("The service publishes a Kafka event (e.g. review.created) with the review payload."),
        numbered("The review-worker consumes the event and recalculates the restaurant's avg_rating and review_count in MongoDB."),
        numbered("The Kafka publish is wrapped in a try/except block so that if Kafka is unavailable, the direct MongoDB write still succeeds and the application does not crash."),
        spacer(),
        h2("4.3 Fault Tolerance"),
        p("The publish_event() function in core/kafka.py is wrapped in a try/except block. If Kafka is unavailable, a warning is logged and execution continues. This allows the application to function correctly in environments without Kafka running (e.g. unit testing, local development without Docker)."),
        spacer(),

        // Section 5
        h1("5. Redux State Management"),
        h2("5.1 Store Structure"),
        p("The frontend uses Redux Toolkit with four slices:"),
        spacer(),
        makeTable(
          ["Slice", "State Shape", "Key Thunks"],
          [
            ["auth", "{ user, token, loading, error }", "loginAsync, signupAsync, logoutAsync"],
            ["restaurants", "{ items[], byId{}, loading, error }", "fetchRestaurants, fetchRestaurantById, createRestaurantAsync"],
            ["reviews", "{ byRestaurant{}, pendingEvents[], loading }", "fetchReviewsForRestaurant, createReviewAsync, updateReviewAsync, deleteReviewAsync"],
            ["favourites", "{ ids[], loading }", "fetchFavourites, toggleFavouriteAsync"],
          ],
          [1800, 3000, 4560]
        ),
        spacer(),
        h2("5.2 MongoDB ID Compatibility"),
        p("When the database was migrated from MySQL (integer IDs) to MongoDB (ObjectId strings), all Redux selectors and thunks that used Number() conversions were updated to use plain strings:"),
        spacer(),
        p("Before migration:", { bold: true }),
        p("selectRestaurantById(Number(id)), state.reviews.byRestaurant[Number(restaurantId)]"),
        p("After migration:", { bold: true }),
        p("selectRestaurantById(id), state.reviews.byRestaurant[restaurantId]"),
        spacer(),
        p("This affected RestaurantDetailPage.jsx, reviewsSlice.js, and favouritesSlice.js."),
        spacer(),
        placeholder("Redux DevTools — fetchList/fulfilled action showing restaurants payload"),
        spacer(),

        // Section 6
        h1("6. Docker & Kubernetes"),
        h2("6.1 Docker Compose"),
        p("The full stack is defined in docker-compose.yml with 11 services. MySQL and all DATABASE_URL environment variables were removed during the MongoDB migration. Each service only receives MONGODB_URL and KAFKA_BOOTSTRAP_SERVERS environment variables."),
        spacer(),
        p("Services:", { bold: true }),
        p("mongodb, zookeeper, kafka, user-service, owner-service, restaurant-service, review-service, review-worker, user-worker, restaurant-worker, frontend."),
        spacer(),
        h2("6.2 Kubernetes Manifest"),
        p("A Kubernetes manifest (k8s/lab2-stack.yaml) defines Deployments and Services for all 11 components in the yelp-lab2 namespace. The frontend Service is of type LoadBalancer to expose it externally. All pod specs reference MONGODB_URL and KAFKA_BOOTSTRAP_SERVERS as environment variables pointing to in-cluster service DNS names (e.g. mongodb:27017, kafka:9092)."),
        spacer(),

        // Section 7
        h1("7. AWS Deployment"),
        p("The application was deployed to AWS EC2 in the us-west-2 (Oregon) region. A t3.medium instance (2 vCPU, 4GB RAM) running Ubuntu 24.04 LTS was provisioned with inbound security group rules for SSH (22), frontend (5173), and API (8000) traffic."),
        spacer(),
        p("The project was transferred via SCP and launched with Docker Compose. All 11 containers started successfully and the application was accessible at http://54.149.126.19:5173."),
        spacer(),
        p("Deployment steps:", { bold: true }),
        numbered("Launched EC2 t3.medium (Ubuntu 24.04 LTS) with 20GB EBS storage"),
        numbered("Installed Docker 29.1.3 and Docker Compose v2 via apt"),
        numbered("Transferred project files via SCP"),
        numbered("Ran docker compose up -d — all 11 containers started in under 4 seconds"),
        numbered("Verified frontend accessible at public IP on port 5173"),
        spacer(),
        placeholder("AWS EC2 Console — instance in Running state (green badge)"),
        spacer(),
        placeholder("SSH terminal — docker ps showing all 11 containers Up"),
        spacer(),
        placeholder("Browser showing Yelp Prototype frontend at http://54.149.126.19:5173"),
        spacer(),

        // Section 8
        h1("8. Performance Testing (JMeter)"),
        h2("8.1 Test Plan"),
        p("Load tests were conducted using Apache JMeter 5.6.3 against the locally deployed Docker Compose stack. The test plan (jmeter/lab2-performance-test-plan.jmx) exercised four endpoint types concurrently:"),
        bullet("Authentication: POST /api/auth/signup (unique user per thread) + POST /api/auth/login"),
        bullet("Restaurant search: GET /api/restaurants/search?q=pasta"),
        bullet("Review submission: POST /api/restaurants/{id}/reviews (with JWT auth token from signup)"),
        spacer(),
        p("A setUp thread group dynamically fetches a real restaurant ID from GET /api/restaurants at test start using a JSONPostProcessor, ensuring the review endpoint targets a valid MongoDB ObjectId. Tests were run at 100, 200, 300, 400, and 500 concurrent users with a 20-second ramp-up period."),
        spacer(),
        h2("8.2 Results Summary"),
        spacer(),
        makeTable(
          ["Concurrent Users", "Avg Response (ms)", "Max Response (ms)", "Throughput (req/s)", "Error %"],
          [
            ["100", "330", "624", "23.8", "11.95%"],
            ["200", "944", "3,215", "44.1", "1.60%"],
            ["300", "3,852", "11,348", "43.5", "0.00%"],
            ["400", "6,365", "20,019", "44.3", "0.05%"],
            ["500", "9,199", "27,511", "44.4", "0.00%"],
          ],
          [1872, 1872, 1872, 1872, 1872]
        ),
        spacer(),
        h2("8.3 Per-Endpoint Breakdown at 500 Users"),
        spacer(),
        makeTable(
          ["Endpoint", "Avg (ms)", "90th Pct (ms)", "Error %"],
          [
            ["GET /api/restaurants/search", "16", "25", "0.00%"],
            ["POST /api/restaurants/{id}/reviews", "388", "598", "0.00%"],
            ["POST /api/auth/signup (pre-login)", "13,918", "23,810", "0.00%"],
            ["POST /api/auth/login", "16,718", "24,836", "0.00%"],
          ],
          [3500, 1620, 1620, 1620]
        ),
        spacer(),
        h2("8.4 Analysis"),
        p("The system reached a throughput ceiling of approximately 44 req/s at 200 concurrent users. Beyond this point, additional users increased queuing latency rather than throughput — a classic sign of resource saturation on a single-node deployment. Importantly, the error rate remained near 0% at all levels above 100 users, demonstrating graceful degradation rather than catastrophic failure."),
        spacer(),
        p("Per-endpoint analysis at 500 users reveals a clear performance split. The GET /api/restaurants/search endpoint averaged just 16ms (backed by a MongoDB indexed query) and POST /api/restaurants/{id}/reviews averaged only 388ms even at peak load — demonstrating that the Kafka producer/consumer pipeline adds negligible latency under concurrency. In contrast, the auth endpoints averaged 14-17 seconds due to bcrypt password hashing, which is intentionally CPU-intensive and does not parallelise well on single-core Docker containers."),
        spacer(),
        p("In a production EKS deployment with horizontal pod autoscaling on the auth service and a managed MongoDB Atlas cluster, the throughput ceiling would scale proportionally with pod count."),
        spacer(),
        placeholder("JMeter Dashboard — APDEX table and 100% PASS pie chart (500 users)"),
        spacer(),
        placeholder("JMeter Response Times Over Time chart (500 users)"),
        spacer(),
        placeholder("JMeter Transactions Per Second chart (500 users)"),
        spacer(),

        // Section 9
        h1("9. Conclusion"),
        p("This lab successfully migrated the Yelp Prototype from a monolithic MySQL/SQLAlchemy architecture to a fully distributed microservices system. MongoDB replaced MySQL as the primary data store, providing flexible document storage, compound indexes, and TTL-based session expiry. Apache Kafka decouples write operations from side-effect processing, enabling the application to remain responsive under load. Redux Toolkit provides predictable frontend state management with clear async thunk patterns. The application was successfully containerised with Docker Compose, deployed to AWS EC2, and load tested with JMeter across five concurrency levels demonstrating graceful degradation under peak load."),
      ]
    }
  ]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("C:/Users/Rohil/Downloads/yelp-prototype lab2/yelp-prototype/docs/Lab2-Report.docx", buffer);
  console.log("Done! Lab2-Report.docx created successfully.");
}).catch(err => {
  console.error("Error:", err);
  process.exit(1);
});

import csv
from collections import defaultdict

import matplotlib.pyplot as plt


def main():
    endpoint_data = defaultdict(list)
    with open("jmeter/results-summary-template.csv", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                c = int(row["concurrency"])
                t = float(row["avg_response_time_ms"])
            except ValueError:
                continue
            endpoint_data[row["endpoint"]].append((c, t))

    for endpoint, points in endpoint_data.items():
        points.sort(key=lambda x: x[0])
        plt.plot([p[0] for p in points], [p[1] for p in points], marker="o", label=endpoint)

    plt.title("Average Response Time vs Concurrency")
    plt.xlabel("Concurrency")
    plt.ylabel("Average Response Time (ms)")
    plt.legend()
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.savefig("jmeter/avg-response-time-graph.png")
    print("Saved jmeter/avg-response-time-graph.png")


if __name__ == "__main__":
    main()

"""
Synthetic Social Impact Assessment (SIA) report log generator — elaborate version.

Produces a longer, multi-paragraph, field-report-style log per project,
consistent with `community_sentiment_score` and `sia_conducted` in the main
dataset. Entirely synthetic/template-generated for a hackathon prototype —
disclose this in the pitch, same as the main dataset.
"""

from pathlib import Path

import numpy as np
import pandas as pd

np.random.seed(7)

# Read/write next to this script (inside /data), so it's portable for the team.
DATA_DIR = Path(__file__).resolve().parent
df = pd.read_csv(DATA_DIR / "land_acquisition_synthetic.csv")

venues = ["the Gram Panchayat office", "the village community hall",
          "a temporary shamiana erected near the proposed site",
          "the local primary school premises", "the block development office"]

stakeholder_groups = [
    "landowning farmers", "tenant cultivators", "agricultural laborers",
    "members of the local women's self-help group", "elected Panchayat members",
    "representatives of the Scheduled Tribe community", "local shopkeepers and traders",
]

opposed_concerns = [
    ("compensation adequacy",
     "several landowners stated that the compensation rate offered does not reflect "
     "current market value in the area, citing recent private land sale transactions "
     "nearby as a benchmark"),
    ("livelihood loss",
     "tenant cultivators and agricultural laborers raised concerns about loss of "
     "livelihood with no clear alternative income or employment plan communicated to them"),
    ("resettlement site readiness",
     "residents expressed apprehension that the proposed resettlement site lacks basic "
     "amenities such as reliable water supply, electricity connections, and road access, "
     "and is located considerably farther from the original village than initially indicated"),
    ("water access",
     "concerns were raised over potential loss of access to a nearby irrigation source, "
     "which several attendees depend on for a second cropping season"),
    ("trust in disbursement timeline",
     "multiple attendees cited delayed compensation disbursement in a neighbouring "
     "district's acquisition as a reason for distrust in the stated timeline for this project"),
    ("consultation adequacy",
     "some residents objected to the adequacy of the consultation process itself, stating "
     "that meeting notices were not widely circulated and that turnout may not represent "
     "the full affected population"),
    ("public purpose justification",
     "a section of attendees questioned whether the project's stated public purpose "
     "justifies displacement at this scale, requesting more detailed project justification "
     "documents be made publicly available"),
    ("ancestral land ties",
     "several families with multi-generational ties to the land expressed emotional and "
     "cultural attachment beyond monetary valuation, requesting the acquiring authority "
     "consider partial realignment of the project boundary where feasible"),
]

neutral_concerns = [
    ("conditional support",
     "a majority of attendees indicated conditional acceptance of the project, contingent "
     "on a revised compensation package being finalized before possession is taken"),
    ("timeline clarity",
     "residents requested clearer, written timelines for compensation disbursement and "
     "physical possession, noting that verbal assurances given during the meeting were "
     "appreciated but insufficient for planning purposes"),
    ("resettlement-specific concerns",
     "concerns raised were largely limited to the readiness of the resettlement site "
     "rather than opposition to the project itself, suggesting the core acquisition is "
     "broadly accepted in principle"),
    ("livelihood support requests",
     "while there was general acceptance of the project's necessity, several attendees "
     "requested specific livelihood support measures such as skill training or preference "
     "in project-related employment"),
    ("information requests",
     "a number of attendees stated they would prefer to review the detailed rehabilitation "
     "package documentation before forming a final opinion, and requested a follow-up "
     "session"),
]

supportive_points = [
    ("employment expectations",
     "there was broad support for the project given the anticipated generation of local "
     "employment opportunities during both construction and operational phases"),
    ("compensation satisfaction",
     "several attendees described the compensation package as fair and, in some cases, "
     "above their initial expectations, referencing similar recent acquisitions in the region"),
    ("connectivity benefits",
     "residents noted that the project would meaningfully improve regional connectivity "
     "and market access for local agricultural produce"),
    ("gram sabha resolution",
     "the Gram Sabha passed a formal resolution supporting the acquisition, citing "
     "long-term developmental benefits to the panchayat as a whole"),
    ("process transparency",
     "community representatives specifically commended the transparency of the "
     "consultation process, noting that queries raised in earlier sessions had been "
     "addressed satisfactorily"),
    ("resettlement site quality",
     "attendees welcomed the proposed resettlement site's proximity to schools, primary "
     "healthcare facilities, and the main road, viewing it as an improvement over current "
     "conditions for several families"),
]

closing_opposed = [
    ("Overall consensus recorded: significant community opposition persists. The "
     "consultation team recommends the acquiring authority revisit the compensation "
     "structure and rehabilitation terms, and conduct at least one further round of "
     "consultation before proceeding to the award stage."),
    ("Overall consensus recorded: the majority of affected families expressed clear "
     "reservations during this round. A follow-up consultation, along with a written "
     "response to the specific concerns raised above, is advised before further action "
     "is taken on this file."),
]

closing_neutral = [
    ("Overall consensus recorded: sentiment is mixed but not adversarial. Conditional "
     "support appears achievable subject to written clarification on the outstanding "
     "livelihood, timeline, and resettlement queries noted above."),
    ("Overall consensus recorded: cautious acceptance was observed across most attendees. "
     "No major objections were raised in principle, though several procedural "
     "clarifications remain outstanding before formal sign-off can be recommended."),
]

closing_supportive = [
    ("Overall consensus recorded: the project enjoys majority community support. No "
     "significant objections were raised during this consultation round, and the "
     "consultation team sees no impediment to proceeding to the next stage."),
    ("Overall consensus recorded: strong community backing was evident throughout the "
     "session, with several attendees actively requesting an expedited timeline for "
     "project commencement."),
]


def pick(bank, n):
    idx = np.random.choice(len(bank), size=min(n, len(bank)), replace=False)
    return [bank[i] for i in idx]


def build_log(row):
    if not row["sia_conducted"]:
        return (
            f"Social Impact Assessment Status — {row['project_type']} Project, "
            f"{row['district']}, {row['state']}\n\n"
            f"No formal Social Impact Assessment has been conducted for this project as of "
            f"the latest administrative review. Community consultation status: not "
            f"initiated. Under Section 4 of the Right to Fair Compensation and Transparency "
            f"in Land Acquisition, Rehabilitation and Resettlement Act, 2013, an SIA is a "
            f"mandatory pre-requisite for acquisitions of this nature and scale. This file "
            f"is flagged pending initiation of the consultation process; no community "
            f"sentiment data is currently available for this project."
        )

    sentiment = row["community_sentiment_score"]
    num_meetings = np.random.randint(2, 5)
    num_attendees = np.random.randint(40, 260)
    num_women = int(num_attendees * np.random.uniform(0.2, 0.4))
    venue = np.random.choice(venues)
    groups = pick(stakeholder_groups, np.random.randint(3, 5))
    groups_text = ", ".join(groups[:-1]) + f", and {groups[-1]}" if len(groups) > 1 else groups[0]

    header = (
        f"Social Impact Assessment Report — {row['project_type']} Project, "
        f"{row['district']}, {row['state']}\n\n"
        f"Consultation process: {num_meetings} public consultation meetings were held over "
        f"the assessment period, conducted at {venue} under the Gram Sabha / local body "
        f"process as required under the LARR Act, 2013. A total of approximately "
        f"{num_attendees} affected residents and stakeholders attended across all sessions, "
        f"including {num_women} women. Attendees represented a cross-section of the "
        f"affected population, including {groups_text}.\n"
    )

    if sentiment < 0.4:
        picks = pick(opposed_concerns, 4)
        concern_lines = "\n".join(f"  - On {topic}: {detail}." for topic, detail in picks)
        body = ("Key concerns raised during consultation:\n" + concern_lines)
        closing = np.random.choice(closing_opposed)
    elif sentiment < 0.7:
        picks = pick(neutral_concerns, 3)
        concern_lines = "\n".join(f"  - On {topic}: {detail}." for topic, detail in picks)
        body = ("Consultation notes (mixed sentiment):\n" + concern_lines)
        closing = np.random.choice(closing_neutral)
    else:
        picks = pick(supportive_points, 4)
        concern_lines = "\n".join(f"  - On {topic}: {detail}." for topic, detail in picks)
        body = ("Consultation notes (majority supportive):\n" + concern_lines)
        closing = np.random.choice(closing_supportive)

    return header + "\n" + body + "\n\n" + closing


df["sia_log_text"] = df.apply(build_log, axis=1)

out = df[["case_id", "state", "district", "project_type", "sia_conducted",
          "community_sentiment_score", "sia_log_text"]]

out.to_csv(DATA_DIR / "sia_logs.csv", index=False)

sample = out[out["sia_conducted"]].sample(5, random_state=1)
sample_dir = DATA_DIR / "sia_log_samples"
sample_dir.mkdir(exist_ok=True)
for _, r in sample.iterrows():
    (sample_dir / f"{r['case_id']}.txt").write_text(r["sia_log_text"])

print("Generated logs for", len(out), "projects")
print("\n=== Sample log (opposed) ===\n")
print(out[out.community_sentiment_score < 0.3].iloc[1]["sia_log_text"])
print("\n=== Sample log (supportive) ===\n")
print(out[out.community_sentiment_score > 0.8].iloc[0]["sia_log_text"])

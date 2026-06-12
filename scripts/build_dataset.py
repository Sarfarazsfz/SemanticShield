#!/usr/bin/env python3
"""
SemanticShield — Synthetic Plagiarism Dataset Generator
=======================================================
Generates ≥ 15 000 labelled sentence-pairs for training a plagiarism
detection model.

Labels
------
  0 — Original   (unrelated pairs from different topic pools)
  1 — Paraphrased (same meaning, multiple linguistic transforms)
  2 — Plagiarized (exact / near-exact / partial / minor-edit copies)

Output
------
  backend/data/generated/plagiarism_dataset.csv
  Columns: text1, text2, label

Usage
-----
  cd backend && python ../scripts/build_dataset.py

No external dependencies — uses Python stdlib + random only.
"""

from __future__ import annotations

import csv
import os
import random
import re
import string
import sys
import time
from pathlib import Path

# ── reproducibility ──────────────────────────────────────────────────────────
SEED = 42
random.seed(SEED)

# ── paths ────────────────────────────────────────────────────────────────────
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
OUTPUT_DIR = PROJECT_ROOT / "backend" / "data" / "generated"
OUTPUT_FILE = OUTPUT_DIR / "plagiarism_dataset.csv"

# ── target counts ────────────────────────────────────────────────────────────
TARGET_PER_CLASS = 5000
TOTAL_TARGET = TARGET_PER_CLASS * 3

# ═══════════════════════════════════════════════════════════════════════════════
# 1.  SEED SENTENCE POOLS  (250+ sentences across 13 topics)
# ═══════════════════════════════════════════════════════════════════════════════

TOPIC_SENTENCES: dict[str, list[str]] = {
    # ── Machine Learning & AI ────────────────────────────────────────────────
    "machine_learning": [
        "Deep neural networks have revolutionized the field of computer vision by enabling automatic feature extraction from raw pixel data.",
        "Gradient descent optimization is the foundational algorithm that drives learning in modern neural network architectures.",
        "Transfer learning allows practitioners to leverage pretrained models and fine-tune them on domain-specific tasks with limited labeled data.",
        "Convolutional neural networks employ spatial filters to detect hierarchical patterns in image data across multiple scales.",
        "Recurrent neural networks are particularly suited for sequential data processing because they maintain hidden state across time steps.",
        "The transformer architecture replaced recurrence with self-attention mechanisms and achieved state-of-the-art results in natural language processing.",
        "Overfitting occurs when a model memorizes training data noise instead of learning generalizable patterns from the underlying distribution.",
        "Batch normalization stabilizes training by normalizing layer inputs and allows the use of higher learning rates during optimization.",
        "Generative adversarial networks consist of a generator and discriminator that compete in a minimax game to produce realistic synthetic data.",
        "Reinforcement learning agents learn optimal policies through trial-and-error interactions with their environment using reward signals.",
        "Feature engineering remains important even with deep learning because domain knowledge can significantly improve model performance.",
        "Regularization techniques such as dropout and weight decay help prevent overfitting by constraining model complexity during training.",
        "Support vector machines find optimal hyperplanes that maximize the margin between different classes in high-dimensional feature spaces.",
        "Random forests aggregate predictions from multiple decision trees to reduce variance and improve classification accuracy.",
        "The bias-variance tradeoff is a fundamental concept that governs the generalization ability of machine learning models.",
        "Hyperparameter tuning involves systematically searching for the best configuration of model parameters using cross-validation techniques.",
        "Dimensionality reduction methods like principal component analysis compress high-dimensional data while preserving essential variance.",
        "Ensemble methods combine multiple weak learners to create a strong learner with improved predictive performance.",
        "Natural language processing models now achieve human-level performance on several benchmark tasks including question answering.",
        "AutoML systems automate the process of model selection and hyperparameter optimization for machine learning pipelines.",
        "Attention mechanisms allow neural networks to focus on the most relevant parts of the input when generating predictions.",
        "Data augmentation techniques artificially expand training datasets by applying random transformations to existing samples.",
    ],

    # ── Climate Science & Environment ────────────────────────────────────────
    "climate_science": [
        "Global average temperatures have risen approximately one degree Celsius above pre-industrial levels due to anthropogenic greenhouse gas emissions.",
        "The melting of polar ice caps contributes to rising sea levels and threatens coastal communities around the world.",
        "Carbon dioxide concentrations in the atmosphere have exceeded four hundred parts per million for the first time in recorded history.",
        "Renewable energy sources including solar and wind power are becoming increasingly cost-competitive with fossil fuel alternatives.",
        "Deforestation in tropical regions releases stored carbon and reduces the planet's capacity to absorb atmospheric carbon dioxide.",
        "Ocean acidification caused by dissolved carbon dioxide threatens marine ecosystems and coral reef biodiversity worldwide.",
        "The Paris Agreement established a framework for international cooperation to limit global warming to well below two degrees Celsius.",
        "Extreme weather events including hurricanes droughts and heat waves are becoming more frequent and intense due to climate change.",
        "Methane emissions from agriculture and fossil fuel extraction contribute significantly to the overall greenhouse effect.",
        "Sustainable development requires balancing economic growth with environmental protection and social equity considerations.",
        "Carbon capture and storage technologies aim to remove carbon dioxide directly from the atmosphere or point sources of emission.",
        "Biodiversity loss accelerates as habitats are destroyed by human activity including urbanization and agricultural expansion.",
        "The water cycle is being disrupted by climate change leading to altered precipitation patterns and increased drought severity.",
        "Electric vehicles represent a critical pathway for reducing transportation sector emissions in the coming decades.",
        "Climate models predict that without significant intervention global temperatures could rise by three to five degrees by century end.",
        "Urban heat islands create significantly higher temperatures in cities compared to surrounding rural areas due to concrete and asphalt.",
        "Permafrost thawing in Arctic regions releases trapped methane and carbon dioxide creating dangerous positive feedback loops.",
        "Green building standards and energy-efficient construction methods can substantially reduce the carbon footprint of the built environment.",
        "Agricultural practices such as cover cropping and no-till farming can help sequester carbon in soil organic matter.",
        "International climate negotiations face challenges in achieving equitable burden-sharing among developed and developing nations.",
    ],

    # ── Quantum Physics ──────────────────────────────────────────────────────
    "quantum_physics": [
        "Quantum entanglement describes a phenomenon where two particles become correlated such that measuring one instantly affects the other.",
        "The Heisenberg uncertainty principle states that the position and momentum of a particle cannot both be precisely determined simultaneously.",
        "Quantum computing harnesses superposition and entanglement to perform calculations that are intractable for classical computers.",
        "Wave-particle duality demonstrates that subatomic entities exhibit both wave-like and particle-like properties depending on the experimental setup.",
        "Quantum tunneling allows particles to pass through energy barriers that would be insurmountable according to classical physics.",
        "The Schrödinger equation governs the time evolution of quantum states and forms the foundation of non-relativistic quantum mechanics.",
        "Quantum decoherence explains how quantum systems lose their coherent superposition states through interaction with the environment.",
        "Bell's theorem proves that no local hidden variable theory can reproduce all predictions of quantum mechanics.",
        "Quantum key distribution offers theoretically unbreakable encryption by exploiting the fundamental properties of quantum measurement.",
        "The double-slit experiment demonstrates the wave nature of particles and remains one of the most iconic experiments in physics.",
        "Quantum field theory unifies quantum mechanics with special relativity and provides the theoretical framework for particle physics.",
        "Superconducting qubits are among the leading physical platforms for building practical quantum computing hardware.",
        "The measurement problem in quantum mechanics concerns how and why the act of observation collapses a quantum superposition.",
        "Quantum error correction codes protect quantum information from decoherence and operational errors during computation.",
        "The many-worlds interpretation proposes that every quantum measurement causes the universe to branch into multiple parallel realities.",
        "Bose-Einstein condensates represent a state of matter where atoms cooled near absolute zero exhibit collective quantum behavior.",
        "Quantum teleportation transfers quantum information between distant particles without physically transmitting the particles themselves.",
        "The standard model of particle physics describes fundamental particles and their interactions through electromagnetic weak and strong forces.",
        "Quantum sensors exploit quantum coherence to achieve measurement precision far beyond the limits of classical instrumentation.",
        "Topological quantum computing uses exotic quasiparticles called anyons to perform inherently fault-tolerant quantum operations.",
    ],

    # ── Economics & Finance ──────────────────────────────────────────────────
    "economics": [
        "Inflation erodes the purchasing power of currency and central banks use monetary policy tools to maintain price stability.",
        "Supply and demand dynamics determine market prices and the equilibrium quantity of goods exchanged in competitive markets.",
        "Gross domestic product measures the total monetary value of all finished goods and services produced within a country during a specific period.",
        "Fiscal policy involves government decisions about taxation and spending that influence macroeconomic conditions and employment levels.",
        "The efficient market hypothesis suggests that asset prices fully reflect all available information making consistent outperformance impossible.",
        "International trade allows countries to specialize in producing goods where they have a comparative advantage increasing global efficiency.",
        "Central banks adjust interest rates to influence borrowing costs and control the money supply in the broader economy.",
        "Behavioral economics challenges the assumption of perfect rationality by demonstrating systematic cognitive biases in economic decision making.",
        "Income inequality has widened in many developed nations as technological change and globalization reshape labor markets.",
        "Public goods are characterized by non-excludability and non-rivalry which creates free-rider problems in their provision.",
        "The Phillips curve illustrates the inverse relationship between unemployment rates and wage inflation in the short run.",
        "Cryptocurrency and blockchain technology represent potential disruptions to traditional financial intermediation and payment systems.",
        "Game theory provides analytical tools for understanding strategic interactions among rational decision-makers in competitive situations.",
        "Externalities occur when economic activities impose costs or benefits on third parties who are not directly involved in the transaction.",
        "Monetary policy transmission operates through multiple channels including the interest rate credit and exchange rate mechanisms.",
        "Financial derivatives including options and futures allow investors to hedge risk and speculate on future price movements.",
        "The tragedy of the commons describes how individuals acting in self-interest can deplete shared resources to the detriment of all.",
        "Modern portfolio theory demonstrates that diversification can reduce risk without necessarily sacrificing expected returns on investment.",
        "Labor market dynamics are shaped by factors including education levels technological change immigration and government regulation.",
        "Economic recessions are characterized by declining output rising unemployment and reduced consumer spending across the economy.",
    ],

    # ── History ──────────────────────────────────────────────────────────────
    "history": [
        "The Industrial Revolution transformed manufacturing processes and fundamentally altered social structures across Europe and North America.",
        "Ancient Egyptian civilization developed sophisticated engineering techniques to construct monumental pyramids that endure thousands of years later.",
        "The Renaissance period witnessed a profound cultural and intellectual revival that reshaped European art science and philosophy.",
        "World War Two resulted in an estimated seventy million casualties and led to the establishment of the United Nations.",
        "The Roman Empire established an extensive network of roads aqueducts and legal systems that influenced Western civilization for centuries.",
        "The French Revolution overthrew the monarchy and established principles of popular sovereignty that spread across the European continent.",
        "The Silk Road facilitated trade and cultural exchange between Eastern and Western civilizations for over a thousand years.",
        "Colonial imperialism reshaped political boundaries and economic structures across Africa Asia and the Americas during the modern era.",
        "The printing press invented by Gutenberg democratized access to knowledge and catalyzed the Protestant Reformation in Europe.",
        "The Cold War divided the world into two ideological blocs and shaped international relations for nearly half a century.",
        "Ancient Greek democracy established foundational principles of citizen participation that continue to influence modern political systems.",
        "The abolition of slavery required centuries of advocacy and resulted in profound social and political transformations across multiple nations.",
        "The Scientific Revolution of the sixteenth and seventeenth centuries established empirical methods that form the basis of modern science.",
        "The fall of the Berlin Wall in nineteen eighty-nine symbolized the end of the Cold War and the reunification of Germany.",
        "The Mongol Empire created the largest contiguous land empire in history stretching from Eastern Europe to the Pacific Ocean.",
        "The American Civil War tested whether a nation conceived in liberty and dedicated to equality could endure as a unified republic.",
        "The Ottoman Empire served as a bridge between East and West and maintained political influence for over six hundred years.",
        "Medieval feudalism organized society into a hierarchical system based on land ownership and reciprocal obligations between lords and vassals.",
        "The Age of Exploration expanded European knowledge of world geography and initiated lasting cultural exchanges between continents.",
        "Archaeological discoveries continue to reshape our understanding of ancient civilizations and prehistoric human societies.",
    ],

    # ── Psychology ────────────────────────────────────────────────────────────
    "psychology": [
        "Cognitive behavioral therapy effectively treats depression and anxiety by helping patients identify and restructure maladaptive thought patterns.",
        "The Stanford prison experiment demonstrated how situational factors can dramatically influence human behavior and ethical decision making.",
        "Working memory capacity is limited to approximately four chunks of information and serves as a bottleneck for complex cognitive processing.",
        "Neuroplasticity allows the brain to reorganize neural pathways in response to new experiences learning and recovery from injury.",
        "Attachment theory explains how early caregiver relationships shape emotional regulation and interpersonal behavior throughout the lifespan.",
        "The bystander effect shows that individuals are less likely to offer help when other people are present during an emergency.",
        "Implicit biases are unconscious attitudes that influence judgment and behavior even among individuals who consciously reject prejudice.",
        "Maslow's hierarchy of needs proposes that human motivation progresses from basic physiological requirements to self-actualization.",
        "The placebo effect demonstrates the powerful influence of expectations and beliefs on physiological and psychological outcomes.",
        "Long-term memory consolidation requires the hippocampus and involves the gradual transfer of information to neocortical storage areas.",
        "Social identity theory explains how group membership influences self-concept and can lead to intergroup discrimination and conflict.",
        "Pavlovian conditioning demonstrates how organisms learn to associate neutral stimuli with biologically significant events through repeated pairing.",
        "Executive function includes cognitive processes such as planning inhibitory control and cognitive flexibility that regulate goal-directed behavior.",
        "The Dunning-Kruger effect describes the tendency for individuals with limited competence to overestimate their own abilities.",
        "Emotional intelligence encompasses the ability to perceive understand manage and utilize emotions in oneself and others effectively.",
        "Sleep deprivation impairs cognitive performance attention and decision-making ability while increasing vulnerability to mood disorders.",
        "Developmental psychology examines how cognitive emotional and social capacities change across the entire human lifespan.",
        "Confirmation bias leads individuals to seek interpret and remember information that confirms their pre-existing beliefs and hypotheses.",
        "Motivation can be categorized as intrinsic arising from internal satisfaction or extrinsic driven by external rewards and consequences.",
        "Stress activates the hypothalamic-pituitary-adrenal axis triggering cortisol release that affects immune function and cognitive performance.",
    ],

    # ── Medicine & Health ────────────────────────────────────────────────────
    "medicine": [
        "Antibiotic resistance poses a growing threat to global public health as bacteria evolve mechanisms to survive antimicrobial treatments.",
        "Vaccination programs have successfully eradicated smallpox and dramatically reduced the incidence of numerous infectious diseases worldwide.",
        "The human genome project mapped all human genes and opened new possibilities for personalized medicine and genetic therapies.",
        "Chronic inflammation is increasingly recognized as a contributing factor in cardiovascular disease diabetes and various autoimmune conditions.",
        "Clinical trials use randomized controlled designs to establish the safety and efficacy of new pharmaceutical interventions.",
        "Telemedicine platforms expanded rapidly during the pandemic and continue to improve healthcare access in underserved rural communities.",
        "Stem cell research holds promise for regenerative medicine by enabling the replacement of damaged tissues and organs.",
        "Mental health disorders affect approximately one in four people globally and represent a significant burden on healthcare systems.",
        "Precision medicine tailors treatment strategies to individual genetic profiles enabling more effective and targeted therapeutic interventions.",
        "The gut microbiome plays a crucial role in immune function metabolism and even neurological health through the gut-brain axis.",
        "Epidemiological studies track disease patterns across populations to identify risk factors and inform public health interventions.",
        "Magnetic resonance imaging provides detailed anatomical visualization without exposing patients to ionizing radiation during diagnostic procedures.",
        "Immunotherapy harnesses the body's own immune system to recognize and destroy cancer cells with fewer side effects than chemotherapy.",
        "Drug interactions can produce adverse effects when multiple medications compete for the same metabolic pathways in the liver.",
        "Global health initiatives have significantly reduced maternal and child mortality rates in developing countries over the past two decades.",
        "Neurodegenerative diseases such as Alzheimer's and Parkinson's involve progressive loss of neuronal structure and function.",
        "Evidence-based medicine integrates clinical expertise with the best available research evidence and patient values in treatment decisions.",
        "Public health surveillance systems enable early detection and rapid response to emerging infectious disease outbreaks.",
        "Organ transplantation requires careful immunological matching to minimize the risk of graft rejection by the recipient's immune system.",
        "Preventive healthcare including regular screenings and lifestyle modifications can significantly reduce the incidence of chronic diseases.",
    ],

    # ── Law & Jurisprudence ──────────────────────────────────────────────────
    "law": [
        "Constitutional law establishes the fundamental framework of government and protects individual rights against state overreach.",
        "The presumption of innocence requires that the prosecution bear the burden of proving guilt beyond a reasonable doubt.",
        "Intellectual property rights including patents copyrights and trademarks incentivize innovation by granting creators exclusive legal protections.",
        "International humanitarian law governs the conduct of armed conflict and seeks to limit the effects of war on civilians.",
        "Contract law enforces voluntary agreements between parties and provides remedies when obligations are not fulfilled as promised.",
        "The separation of powers divides governmental authority among legislative executive and judicial branches to prevent tyranny.",
        "Privacy legislation continues to evolve as digital technologies create new challenges for personal data protection and surveillance oversight.",
        "Criminal sentencing guidelines aim to balance the goals of punishment deterrence rehabilitation and public safety.",
        "Tort law provides a mechanism for individuals to seek compensation when they suffer harm due to the negligence of others.",
        "The rule of law requires that legal principles are applied consistently and transparently to all members of society.",
        "Environmental regulations impose legal obligations on corporations to minimize pollution and protect natural ecosystems from degradation.",
        "Due process guarantees fair treatment through the judicial system and protects individuals from arbitrary government action.",
        "Antitrust legislation promotes market competition by preventing monopolistic practices and corporate mergers that harm consumers.",
        "Human rights law establishes universal standards of dignity and freedom that transcend national borders and cultural differences.",
        "Legal precedent establishes binding interpretations of law that lower courts must follow when deciding similar cases.",
        "Alternative dispute resolution including mediation and arbitration offers faster and less costly alternatives to traditional litigation.",
        "Corporate governance law regulates the relationships among shareholders directors and management to ensure accountability and transparency.",
        "Immigration law balances national security concerns with humanitarian obligations and economic labor market requirements.",
        "Cybersecurity law addresses the legal frameworks for preventing investigating and prosecuting computer crimes and data breaches.",
        "Judicial independence ensures that courts can interpret and apply the law without political interference or external pressure.",
    ],

    # ── Sports Science ───────────────────────────────────────────────────────
    "sports": [
        "High-intensity interval training improves cardiovascular fitness and metabolic health more efficiently than steady-state aerobic exercise.",
        "Sports psychology techniques including visualization and mental rehearsal can significantly enhance competitive athletic performance.",
        "Biomechanical analysis uses motion capture technology to optimize athletic technique and reduce the risk of musculoskeletal injury.",
        "Periodization in athletic training systematically varies training volume and intensity to maximize adaptation and prevent overtraining.",
        "Nutritional strategies including carbohydrate loading and protein timing play essential roles in athletic recovery and performance optimization.",
        "Concussion protocols in contact sports have become increasingly rigorous as research reveals the long-term effects of repeated head trauma.",
        "Wearable technology and biometric sensors provide real-time physiological data that informs training decisions and injury prevention strategies.",
        "The Olympic movement promotes international cooperation and athletic excellence while facing ongoing challenges related to doping and governance.",
        "Plyometric exercises develop explosive muscular power by utilizing the stretch-shortening cycle of muscle contraction.",
        "Recovery modalities including cold water immersion and compression therapy help athletes manage inflammation and muscle soreness after training.",
        "Talent identification programs use physiological and psychological assessments to select promising young athletes for elite development pathways.",
        "Altitude training stimulates red blood cell production and can improve oxygen delivery capacity in endurance athletes.",
        "Anti-doping regulations aim to preserve fair competition by detecting and penalizing the use of performance-enhancing substances.",
        "Team dynamics and communication patterns significantly influence collective performance and strategic decision-making in team sports.",
        "Exercise physiology research demonstrates that regular physical activity reduces the risk of chronic diseases and improves mental health.",
        "Sports analytics leverages statistical modeling and data science to optimize team strategy and player evaluation decisions.",
        "Injury rehabilitation combines progressive loading protocols with neuromuscular training to restore function and prevent reinjury.",
        "Youth sports participation promotes physical literacy and social development but must balance competition with age-appropriate training loads.",
        "Gender equity in sports has improved substantially but significant disparities in funding media coverage and compensation persist.",
        "The science of coaching effectiveness combines pedagogical skill with motivational techniques and tactical expertise.",
    ],

    # ── Philosophy ───────────────────────────────────────────────────────────
    "philosophy": [
        "Epistemology investigates the nature and limits of human knowledge including the conditions under which beliefs can be justified.",
        "Existentialism emphasizes individual freedom and responsibility arguing that existence precedes essence in defining human nature.",
        "Utilitarianism evaluates the morality of actions based on their consequences specifically whether they maximize overall happiness and well-being.",
        "The mind-body problem addresses the fundamental question of how mental states relate to physical brain processes.",
        "Ethical relativism holds that moral judgments are not universally valid but are relative to cultural or individual perspectives.",
        "The trolley problem presents a moral dilemma that illustrates the tension between consequentialist and deontological ethical frameworks.",
        "Phenomenology examines the structures of conscious experience and the ways in which things appear to the perceiving subject.",
        "Social contract theory proposes that political authority derives its legitimacy from an agreement among individuals to form a society.",
        "Pragmatism judges the truth of ideas by their practical consequences and usefulness rather than their correspondence to abstract reality.",
        "Determinism holds that all events including human actions are ultimately determined by prior causes operating according to natural laws.",
        "Virtue ethics focuses on the development of moral character rather than adherence to rules or evaluation of consequences.",
        "The problem of induction questions whether past observations can reliably justify expectations about future events and regularities.",
        "Aesthetics explores the nature of beauty artistic expression and the criteria by which creative works are evaluated and appreciated.",
        "Political philosophy examines concepts of justice equality liberty and the proper role of government in organizing society.",
        "Logical positivism maintained that only empirically verifiable statements and logical tautologies are meaningful propositions.",
        "The concept of free will remains contested among philosophers who debate whether genuine choice is compatible with determinism.",
        "Stoic philosophy advocates accepting what cannot be controlled while exercising rational virtue in matters within one's power.",
        "Feminist philosophy critiques traditional philosophical frameworks and examines how gender shapes knowledge power and social structures.",
        "The philosophy of science investigates the methods assumptions and implications of scientific inquiry and theory formation.",
        "Moral realism asserts that ethical statements express objective truths that exist independently of individual beliefs or cultural conventions.",
    ],

    # ── Education & Pedagogy ─────────────────────────────────────────────────
    "education": [
        "Constructivist learning theory posits that students build knowledge through active engagement rather than passive reception of information.",
        "Formative assessment provides ongoing feedback that helps teachers adjust instruction to meet individual student learning needs.",
        "The achievement gap between socioeconomic groups persists despite decades of educational reform and targeted intervention programs.",
        "Differentiated instruction adapts teaching methods and materials to accommodate diverse learning styles and ability levels in the classroom.",
        "Project-based learning engages students in authentic real-world problems that develop critical thinking and collaboration skills.",
        "Standardized testing provides measurable data on student performance but critics argue it narrows curriculum and increases student anxiety.",
        "Educational technology including adaptive learning platforms can personalize instruction and provide immediate feedback to learners.",
        "Teacher professional development programs should be sustained collaborative and directly connected to classroom practice for maximum effectiveness.",
        "Early childhood education programs produce lasting benefits in cognitive development and social-emotional skills that persist into adulthood.",
        "Inclusive education ensures that students with disabilities receive appropriate support and access to the general education curriculum.",
        "Metacognitive strategies teach students to monitor and regulate their own learning processes for improved academic outcomes.",
        "The flipped classroom model reverses traditional instruction by delivering content outside class and using class time for active learning.",
        "Culturally responsive teaching recognizes the importance of including students' cultural references in all aspects of learning.",
        "Higher education institutions face increasing pressure to demonstrate the value and relevance of academic programs to employers.",
        "Collaborative learning structures promote deeper understanding by requiring students to articulate explain and defend their reasoning to peers.",
        "Literacy instruction must address both decoding skills and reading comprehension strategies to develop proficient readers.",
        "Student motivation is enhanced by autonomy mastery and purpose which foster intrinsic engagement with academic material.",
        "Curriculum design should align learning objectives instructional activities and assessment methods to ensure coherent educational experiences.",
        "Digital literacy has become an essential competency requiring schools to teach critical evaluation of online information sources.",
        "Educational equity requires addressing systemic barriers that prevent marginalized students from accessing high-quality learning opportunities.",
    ],

    # ── Art & Culture ────────────────────────────────────────────────────────
    "art_culture": [
        "Impressionist painters revolutionized artistic practice by emphasizing light and color over precise representational detail.",
        "Digital art forms including generative algorithms and virtual reality installations are expanding the boundaries of creative expression.",
        "Cultural heritage preservation requires balancing modern development pressures with the conservation of historically significant sites and artifacts.",
        "Music theory provides a systematic framework for understanding melody harmony rhythm and the structural organization of compositions.",
        "Contemporary performance art challenges traditional boundaries between artist and audience by emphasizing process over finished product.",
        "Film as a medium uniquely combines visual storytelling with sound editing and performance to create immersive narrative experiences.",
        "Literary criticism applies diverse theoretical frameworks to analyze the themes structures and cultural significance of written works.",
        "Street art and graffiti have evolved from vandalism to recognized art forms that comment on social and political issues.",
        "Museums play a vital role in cultural education by curating collections that preserve and interpret human artistic achievement.",
        "The relationship between art and technology has been continuously redefined as new tools and platforms enable novel creative practices.",
        "Architecture reflects cultural values and technological capabilities while shaping the physical environments where people live and work.",
        "Dance traditions from around the world embody cultural identity and provide powerful forms of nonverbal communication and expression.",
        "Photography transformed visual culture by democratizing image-making and providing new ways to document human experience.",
        "Classical music traditions continue to influence contemporary composition while adapting to changing audience expectations and cultural contexts.",
        "Public art installations transform urban spaces and invite community engagement with aesthetic and social themes.",
        "The global art market reflects complex intersections of cultural value economic speculation and institutional legitimacy.",
        "Creative writing workshops foster literary talent by providing structured feedback and encouraging experimentation with form and voice.",
        "Sculpture as a three-dimensional art form engages spatial perception and invites physical interaction between viewer and object.",
        "Cross-cultural artistic exchange has accelerated through digital platforms enabling artists to reach global audiences instantly.",
        "Art therapy uses creative expression as a therapeutic tool to improve mental health and emotional well-being.",
    ],

    # ── Technology & Computing ───────────────────────────────────────────────
    "technology": [
        "Cloud computing enables organizations to access scalable computing resources on demand without maintaining expensive physical infrastructure.",
        "Cybersecurity threats including ransomware and phishing attacks continue to evolve requiring constant adaptation of defensive strategies.",
        "The Internet of Things connects billions of physical devices creating vast networks of sensors and actuators that generate enormous data streams.",
        "Blockchain technology provides a decentralized and tamper-resistant ledger system with applications beyond cryptocurrency in supply chain management.",
        "Agile software development methodologies emphasize iterative progress collaboration and flexibility in responding to changing requirements.",
        "Open source software communities contribute to technological innovation by enabling collaborative development and transparent peer review.",
        "Database management systems organize and retrieve structured data efficiently using relational or non-relational data models.",
        "Edge computing processes data closer to where it is generated reducing latency and bandwidth requirements for time-sensitive applications.",
        "Version control systems like Git enable collaborative software development by tracking changes and managing concurrent modifications to codebases.",
        "Microservices architecture decomposes applications into small independently deployable services that communicate through well-defined interfaces.",
        "Containerization technology packages applications with their dependencies ensuring consistent behavior across different computing environments.",
        "Application programming interfaces define standardized protocols that enable different software systems to communicate and exchange data.",
        "DevOps practices bridge the gap between software development and operations teams to accelerate delivery and improve reliability.",
        "Data privacy regulations require organizations to implement technical and organizational measures to protect personal information.",
        "Distributed computing systems coordinate multiple networked computers to solve complex problems that exceed the capacity of individual machines.",
        "User experience design focuses on creating intuitive and accessible interfaces that meet the needs and expectations of end users.",
        "Software testing methodologies including unit integration and end-to-end testing ensure application quality and reliability before deployment.",
        "Network protocols govern the rules and conventions for data transmission across interconnected computer systems and the internet.",
        "Artificial intelligence ethics addresses concerns about algorithmic bias transparency accountability and the societal impact of automated decisions.",
        "Quantum computing promises to solve certain computational problems exponentially faster than classical computers using quantum mechanical principles.",
    ],
}

# Sanity check
_total_seeds = sum(len(v) for v in TOPIC_SENTENCES.values())
assert _total_seeds >= 250, f"Need ≥250 seed sentences, got {_total_seeds}"
assert len(TOPIC_SENTENCES) >= 12, f"Need ≥12 topics, got {len(TOPIC_SENTENCES)}"

# ═══════════════════════════════════════════════════════════════════════════════
# 2.  SYNONYM DICTIONARY  (150+ word mappings)
# ═══════════════════════════════════════════════════════════════════════════════

SYNONYM_MAP: dict[str, list[str]] = {
    "important": ["significant", "crucial", "essential", "vital", "critical"],
    "significant": ["substantial", "considerable", "noteworthy", "important", "meaningful"],
    "demonstrate": ["show", "illustrate", "reveal", "indicate", "establish"],
    "show": ["demonstrate", "reveal", "indicate", "exhibit", "display"],
    "reveal": ["uncover", "disclose", "expose", "demonstrate", "show"],
    "investigate": ["examine", "explore", "study", "analyze", "research"],
    "examine": ["investigate", "analyze", "study", "inspect", "scrutinize"],
    "analyze": ["examine", "evaluate", "assess", "study", "investigate"],
    "establish": ["create", "found", "set up", "institute", "determine"],
    "create": ["produce", "generate", "develop", "form", "establish"],
    "develop": ["create", "advance", "evolve", "progress", "build"],
    "build": ["construct", "develop", "create", "assemble", "erect"],
    "improve": ["enhance", "boost", "strengthen", "advance", "refine"],
    "enhance": ["improve", "augment", "strengthen", "enrich", "amplify"],
    "reduce": ["decrease", "diminish", "lower", "minimize", "lessen"],
    "decrease": ["reduce", "decline", "diminish", "lower", "drop"],
    "increase": ["raise", "elevate", "boost", "expand", "grow"],
    "expand": ["extend", "broaden", "enlarge", "widen", "increase"],
    "large": ["substantial", "considerable", "extensive", "vast", "sizable"],
    "small": ["minor", "modest", "slight", "limited", "minimal"],
    "use": ["utilize", "employ", "apply", "leverage", "adopt"],
    "utilize": ["use", "employ", "harness", "leverage", "apply"],
    "employ": ["use", "utilize", "apply", "engage", "deploy"],
    "provide": ["offer", "supply", "deliver", "furnish", "give"],
    "offer": ["provide", "present", "supply", "propose", "extend"],
    "require": ["need", "demand", "necessitate", "call for", "entail"],
    "need": ["require", "demand", "necessitate", "call for", "want"],
    "allow": ["enable", "permit", "let", "authorize", "facilitate"],
    "enable": ["allow", "permit", "empower", "facilitate", "support"],
    "prevent": ["stop", "avert", "hinder", "block", "preclude"],
    "include": ["incorporate", "encompass", "comprise", "contain", "cover"],
    "affect": ["influence", "impact", "alter", "change", "modify"],
    "influence": ["affect", "shape", "impact", "determine", "sway"],
    "change": ["alter", "modify", "transform", "adjust", "revise"],
    "maintain": ["preserve", "sustain", "keep", "retain", "uphold"],
    "support": ["sustain", "uphold", "back", "bolster", "reinforce"],
    "achieve": ["accomplish", "attain", "reach", "realize", "secure"],
    "remain": ["stay", "persist", "continue", "endure", "last"],
    "suggest": ["indicate", "propose", "imply", "recommend", "hint"],
    "indicate": ["suggest", "signal", "denote", "point to", "reveal"],
    "identify": ["recognize", "determine", "detect", "pinpoint", "discern"],
    "determine": ["establish", "ascertain", "identify", "decide", "resolve"],
    "describe": ["characterize", "depict", "portray", "outline", "explain"],
    "explain": ["clarify", "elucidate", "describe", "illustrate", "account for"],
    "consider": ["contemplate", "evaluate", "assess", "examine", "weigh"],
    "evaluate": ["assess", "appraise", "judge", "examine", "analyze"],
    "assess": ["evaluate", "gauge", "measure", "judge", "appraise"],
    "measure": ["quantify", "gauge", "assess", "calculate", "determine"],
    "produce": ["generate", "create", "yield", "manufacture", "make"],
    "generate": ["produce", "create", "yield", "cause", "bring about"],
    "apply": ["implement", "use", "employ", "execute", "administer"],
    "implement": ["apply", "execute", "carry out", "deploy", "put into practice"],
    "result": ["outcome", "consequence", "effect", "finding", "product"],
    "effect": ["impact", "consequence", "result", "influence", "outcome"],
    "method": ["approach", "technique", "procedure", "strategy", "methodology"],
    "approach": ["method", "strategy", "technique", "framework", "way"],
    "process": ["procedure", "method", "mechanism", "operation", "system"],
    "system": ["framework", "structure", "mechanism", "arrangement", "network"],
    "structure": ["framework", "organization", "arrangement", "architecture", "configuration"],
    "function": ["role", "purpose", "operation", "task", "activity"],
    "role": ["function", "part", "position", "capacity", "contribution"],
    "factor": ["element", "component", "aspect", "variable", "determinant"],
    "aspect": ["element", "facet", "dimension", "component", "feature"],
    "feature": ["characteristic", "attribute", "property", "trait", "quality"],
    "characteristic": ["feature", "trait", "attribute", "property", "quality"],
    "pattern": ["trend", "tendency", "regularity", "configuration", "arrangement"],
    "problem": ["issue", "challenge", "difficulty", "complication", "obstacle"],
    "issue": ["problem", "concern", "matter", "question", "challenge"],
    "challenge": ["difficulty", "obstacle", "problem", "hurdle", "barrier"],
    "strategy": ["plan", "approach", "method", "tactic", "scheme"],
    "concept": ["idea", "notion", "principle", "theory", "construct"],
    "theory": ["hypothesis", "concept", "framework", "model", "proposition"],
    "principle": ["rule", "guideline", "standard", "tenet", "doctrine"],
    "evidence": ["proof", "data", "indication", "testimony", "documentation"],
    "data": ["information", "evidence", "statistics", "findings", "records"],
    "information": ["data", "knowledge", "intelligence", "details", "facts"],
    "knowledge": ["understanding", "expertise", "awareness", "learning", "insight"],
    "research": ["study", "investigation", "inquiry", "analysis", "examination"],
    "study": ["research", "investigation", "analysis", "examination", "survey"],
    "report": ["account", "summary", "analysis", "review", "assessment"],
    "particularly": ["especially", "specifically", "notably", "chiefly", "primarily"],
    "especially": ["particularly", "notably", "specifically", "mainly", "primarily"],
    "however": ["nevertheless", "nonetheless", "yet", "still", "though"],
    "therefore": ["consequently", "thus", "hence", "accordingly", "as a result"],
    "although": ["though", "even though", "while", "whereas", "despite the fact that"],
    "furthermore": ["moreover", "additionally", "also", "besides", "in addition"],
    "moreover": ["furthermore", "additionally", "also", "besides", "what is more"],
    "primarily": ["mainly", "chiefly", "principally", "predominantly", "largely"],
    "approximately": ["roughly", "about", "around", "nearly", "close to"],
    "rapidly": ["quickly", "swiftly", "fast", "speedily", "promptly"],
    "significantly": ["considerably", "substantially", "markedly", "notably", "greatly"],
    "effectively": ["efficiently", "successfully", "competently", "proficiently", "capably"],
    "currently": ["presently", "now", "at present", "today", "at this time"],
    "recently": ["lately", "of late", "in recent times", "not long ago", "newly"],
    "traditional": ["conventional", "customary", "established", "classical", "time-honored"],
    "modern": ["contemporary", "current", "recent", "present-day", "up-to-date"],
    "fundamental": ["basic", "essential", "core", "primary", "underlying"],
    "complex": ["complicated", "intricate", "sophisticated", "elaborate", "multifaceted"],
    "critical": ["crucial", "vital", "essential", "important", "pivotal"],
    "various": ["diverse", "multiple", "several", "numerous", "assorted"],
    "specific": ["particular", "precise", "definite", "exact", "distinct"],
    "potential": ["possible", "prospective", "likely", "probable", "conceivable"],
    "available": ["accessible", "obtainable", "at hand", "ready", "on hand"],
    "appropriate": ["suitable", "fitting", "proper", "relevant", "apt"],
    "effective": ["efficient", "successful", "productive", "capable", "competent"],
    "consistent": ["uniform", "steady", "constant", "reliable", "stable"],
    "substantial": ["considerable", "significant", "large", "ample", "meaningful"],
    "comprehensive": ["thorough", "extensive", "complete", "all-inclusive", "exhaustive"],
    "sufficient": ["adequate", "enough", "satisfactory", "ample", "acceptable"],
    "relevant": ["pertinent", "applicable", "related", "appropriate", "germane"],
    "contribute": ["add", "provide", "supply", "help", "assist"],
    "involve": ["include", "entail", "comprise", "encompass", "require"],
    "ensure": ["guarantee", "secure", "confirm", "verify", "safeguard"],
    "focus": ["concentrate", "center", "emphasize", "direct", "target"],
    "address": ["tackle", "handle", "deal with", "confront", "resolve"],
    "represent": ["symbolize", "signify", "embody", "typify", "exemplify"],
    "promote": ["encourage", "foster", "advance", "support", "facilitate"],
    "occur": ["happen", "take place", "arise", "emerge", "transpire"],
    "operate": ["function", "work", "run", "perform", "act"],
    "distribute": ["allocate", "disperse", "spread", "disseminate", "deliver"],
    "restrict": ["limit", "constrain", "confine", "curb", "control"],
    "transform": ["convert", "change", "alter", "modify", "reshape"],
    "observe": ["notice", "watch", "witness", "perceive", "detect"],
    "acquire": ["obtain", "gain", "get", "secure", "procure"],
    "adapt": ["adjust", "modify", "accommodate", "conform", "tailor"],
    "regulate": ["control", "govern", "manage", "supervise", "oversee"],
    "integrate": ["combine", "merge", "unify", "incorporate", "blend"],
    "facilitate": ["enable", "assist", "aid", "promote", "expedite"],
    "communicate": ["convey", "transmit", "express", "relay", "share"],
    "collaborate": ["cooperate", "partner", "work together", "team up", "join forces"],
    "emphasize": ["stress", "highlight", "underscore", "accentuate", "focus on"],
    "impact": ["effect", "influence", "consequence", "result", "repercussion"],
    "framework": ["structure", "system", "model", "architecture", "scaffold"],
    "mechanism": ["process", "system", "method", "device", "instrument"],
    "environment": ["surroundings", "setting", "context", "habitat", "milieu"],
    "context": ["setting", "environment", "circumstances", "situation", "background"],
    "perspective": ["viewpoint", "standpoint", "outlook", "angle", "position"],
    "outcome": ["result", "consequence", "effect", "product", "conclusion"],
    "capacity": ["ability", "capability", "potential", "competence", "power"],
    "component": ["element", "part", "constituent", "piece", "segment"],
    "response": ["reaction", "reply", "answer", "feedback", "retort"],
    "individual": ["person", "single", "particular", "distinct", "separate"],
    "community": ["society", "group", "population", "neighborhood", "collective"],
    "resource": ["asset", "supply", "material", "means", "source"],
    "benefit": ["advantage", "gain", "merit", "value", "reward"],
    "risk": ["danger", "hazard", "threat", "peril", "jeopardy"],
    "goal": ["objective", "aim", "target", "purpose", "ambition"],
    "limit": ["boundary", "restriction", "constraint", "cap", "ceiling"],
    "basis": ["foundation", "ground", "base", "premise", "underpinning"],
    "region": ["area", "zone", "territory", "district", "locale"],
    "period": ["era", "epoch", "phase", "time", "duration"],
    "worldwide": ["globally", "internationally", "across the globe", "universally"],
    "primary": ["main", "chief", "principal", "leading", "foremost"],
    "advanced": ["sophisticated", "developed", "cutting-edge", "progressive", "state-of-the-art"],
    "diverse": ["varied", "assorted", "heterogeneous", "multifarious", "wide-ranging"],
    "accurate": ["precise", "exact", "correct", "reliable", "faithful"],
    "broad": ["wide", "extensive", "expansive", "comprehensive", "far-reaching"],
    "novel": ["new", "innovative", "original", "unprecedented", "fresh"],
    "key": ["crucial", "essential", "central", "pivotal", "core"],
}

# Sanity check
assert len(SYNONYM_MAP) >= 150, f"Need ≥150 synonym entries, got {len(SYNONYM_MAP)}"

# ═══════════════════════════════════════════════════════════════════════════════
# 3.  PHRASE SUBSTITUTION DICTIONARY  (academic phrases)
# ═══════════════════════════════════════════════════════════════════════════════

PHRASE_SUBSTITUTIONS: list[tuple[str, str]] = [
    ("as a result", "consequently"),
    ("consequently", "as a result"),
    ("in addition", "furthermore"),
    ("furthermore", "in addition"),
    ("on the other hand", "conversely"),
    ("conversely", "on the other hand"),
    ("for example", "for instance"),
    ("for instance", "for example"),
    ("in order to", "so as to"),
    ("so as to", "in order to"),
    ("due to", "because of"),
    ("because of", "due to"),
    ("in terms of", "with regard to"),
    ("with regard to", "in terms of"),
    ("plays a crucial role", "is of paramount importance"),
    ("is of paramount importance", "plays a crucial role"),
    ("it is important to note", "it should be emphasized"),
    ("it should be emphasized", "it is important to note"),
    ("according to", "as stated by"),
    ("as stated by", "according to"),
    ("in conclusion", "to summarize"),
    ("to summarize", "in conclusion"),
    ("such as", "including"),
    ("including", "such as"),
    ("as well as", "along with"),
    ("along with", "as well as"),
    ("in the context of", "within the framework of"),
    ("within the framework of", "in the context of"),
    ("with respect to", "regarding"),
    ("regarding", "with respect to"),
    ("a wide range of", "a broad spectrum of"),
    ("a broad spectrum of", "a wide range of"),
    ("plays a vital role", "is fundamentally important"),
    ("has been shown to", "has been demonstrated to"),
    ("remains a challenge", "continues to be difficult"),
    ("in recent years", "over the past few years"),
    ("over the past few years", "in recent years"),
    ("leads to", "results in"),
    ("results in", "leads to"),
    ("is characterized by", "is defined by"),
    ("is defined by", "is characterized by"),
    ("contributes to", "plays a part in"),
    ("plays a part in", "contributes to"),
    ("is associated with", "is linked to"),
    ("is linked to", "is associated with"),
    ("in particular", "specifically"),
    ("specifically", "in particular"),
    ("is essential for", "is necessary for"),
    ("is necessary for", "is essential for"),
    ("gives rise to", "produces"),
    ("takes into account", "considers"),
    ("a significant number of", "many"),
    ("a growing body of", "increasing amounts of"),
    ("the vast majority of", "most"),
]

# ═══════════════════════════════════════════════════════════════════════════════
# 4.  FILLER WORDS & PHRASES
# ═══════════════════════════════════════════════════════════════════════════════

FILLER_INSERTS = [
    "indeed", "certainly", "essentially", "basically", "actually",
    "clearly", "evidently", "arguably", "naturally", "undoubtedly",
    "interestingly", "remarkably", "notably", "importantly", "critically",
    "in fact", "of course", "without doubt", "to be sure", "in essence",
]

# ═══════════════════════════════════════════════════════════════════════════════
# 5.  TRANSFORMATION FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

def synonym_replace(text: str, max_replacements: int = 3) -> str:
    """Replace up to *max_replacements* words with synonyms."""
    words = text.split()
    indices = list(range(len(words)))
    random.shuffle(indices)
    replaced = 0
    for idx in indices:
        if replaced >= max_replacements:
            break
        w_lower = words[idx].strip(string.punctuation).lower()
        if w_lower in SYNONYM_MAP:
            syn = random.choice(SYNONYM_MAP[w_lower])
            # Preserve punctuation and capitalisation
            orig = words[idx]
            # Extract trailing punctuation
            trail = ""
            while orig and orig[-1] in string.punctuation:
                trail = orig[-1] + trail
                orig = orig[:-1]
            # Preserve leading capital
            if orig and orig[0].isupper():
                syn = syn[0].upper() + syn[1:]
            words[idx] = syn + trail
            replaced += 1
    return " ".join(words)


def passive_to_active_heuristic(text: str) -> str:
    """Heuristic active↔passive conversion via sentence restructuring."""
    # Pattern: "X is/are/was/were <verb>ed by Y" → "Y <verb>s X"
    pattern = re.compile(
        r"\b([A-Z][a-z]+(?:\s[a-z]+)*)\s+(is|are|was|were)\s+"
        r"(\w+ed)\s+by\s+([\w\s]+?)([.!?]?)$",
        re.IGNORECASE,
    )
    m = pattern.search(text)
    if m:
        subject = m.group(4).strip()
        verb_base = m.group(3)
        obj = m.group(1)
        punct = m.group(5) or "."
        # Simple: Y verb-s X
        if subject and subject[0].islower():
            subject = subject[0].upper() + subject[1:]
        return f"{subject} {verb_base[:-1]}s {obj.lower()}{punct}"
    return text


def clause_reorder(text: str) -> str:
    """Move a subordinate clause to the beginning or end of the sentence."""
    # Split on common conjunctions / comma-clauses
    conjunctions = [" because ", " since ", " although ", " while ", " whereas ",
                    " when ", " if ", " as ", " after ", " before ", " until "]
    for conj in conjunctions:
        if conj in text.lower():
            idx = text.lower().index(conj)
            first_part = text[:idx].rstrip(" ,")
            second_part = text[idx + len(conj):].strip()
            # Move the subordinate clause to the front
            conj_word = conj.strip()
            # Remove trailing punctuation from second part for reattach
            trail = ""
            if second_part and second_part[-1] in ".!?":
                trail = second_part[-1]
                second_part = second_part[:-1]
            if first_part and first_part[-1] in ".!?":
                first_part = first_part[:-1]
            # Capitalize
            result = f"{conj_word.capitalize()} {second_part.lower()}, {first_part.lower()}{trail}"
            # Fix first char upper
            result = result[0].upper() + result[1:]
            return result
    return text


def add_filler(text: str) -> str:
    """Insert a filler word/phrase near the beginning of the sentence."""
    filler = random.choice(FILLER_INSERTS)
    words = text.split()
    if len(words) < 3:
        return text
    # Insert after the first 1-3 words
    pos = random.randint(1, min(3, len(words) - 1))
    # If inserting a multi-word filler, wrap in commas
    if " " in filler:
        words.insert(pos, f", {filler},")
    else:
        words.insert(pos, f", {filler},")
    return " ".join(words)


def remove_filler(text: str) -> str:
    """Remove common filler words if present."""
    for filler in FILLER_INSERTS:
        patterns = [
            f", {filler}, ",
            f", {filler} ",
            f" {filler}, ",
            f" {filler} ",
        ]
        for p in patterns:
            if p in text.lower():
                idx = text.lower().index(p)
                text = text[:idx] + " " + text[idx + len(p):]
                text = re.sub(r"  +", " ", text).strip()
                return text
    return text


def phrase_substitute(text: str) -> str:
    """Apply one academic phrase substitution."""
    text_lower = text.lower()
    random.shuffle(PHRASE_SUBSTITUTIONS)
    for orig, replacement in PHRASE_SUBSTITUTIONS:
        if orig in text_lower:
            idx = text_lower.index(orig)
            # Preserve case of first letter
            if text[idx].isupper():
                replacement = replacement[0].upper() + replacement[1:]
            text = text[:idx] + replacement + text[idx + len(orig):]
            return text
    return text


def word_reorder(text: str) -> str:
    """Swap adjacent adjective-noun or adverb-verb pairs where plausible."""
    words = text.split()
    if len(words) < 5:
        return text
    # Try a few random adjacent swaps
    attempts = 0
    for _ in range(3):
        idx = random.randint(1, len(words) - 3)
        w1 = words[idx].strip(string.punctuation).lower()
        w2 = words[idx + 1].strip(string.punctuation).lower()
        # Simple heuristic: swap if both are plain lowercase words of similar length
        if (w1.isalpha() and w2.isalpha() and
                3 <= len(w1) <= 12 and 3 <= len(w2) <= 12 and
                w1 not in ("the", "and", "for", "are", "was", "that", "this", "with", "from") and
                w2 not in ("the", "and", "for", "are", "was", "that", "this", "with", "from")):
            words[idx], words[idx + 1] = words[idx + 1], words[idx]
            attempts += 1
            if attempts >= 1:
                break
    return " ".join(words)


# Master list of transforms (each takes a string and returns a string)
TRANSFORMS = [
    synonym_replace,
    passive_to_active_heuristic,
    clause_reorder,
    add_filler,
    remove_filler,
    phrase_substitute,
    word_reorder,
]

# ═══════════════════════════════════════════════════════════════════════════════
# 6.  PAIR GENERATORS
# ═══════════════════════════════════════════════════════════════════════════════

def _all_sentences_flat() -> list[tuple[str, str]]:
    """Return a flat list of (topic, sentence) tuples."""
    flat: list[tuple[str, str]] = []
    for topic, sents in TOPIC_SENTENCES.items():
        for s in sents:
            flat.append((topic, s))
    return flat


def generate_original_pairs(n: int) -> list[tuple[str, str, int]]:
    """
    Label 0 — unrelated pairs from DIFFERENT topics.
    """
    flat = _all_sentences_flat()
    topics = list(TOPIC_SENTENCES.keys())
    pairs: list[tuple[str, str, int]] = []
    seen: set[tuple[str, str]] = set()

    attempts = 0
    while len(pairs) < n and attempts < n * 20:
        attempts += 1
        t1, t2 = random.sample(topics, 2)
        s1 = random.choice(TOPIC_SENTENCES[t1])
        s2 = random.choice(TOPIC_SENTENCES[t2])
        key = (s1, s2) if s1 < s2 else (s2, s1)
        if key not in seen:
            seen.add(key)
            pairs.append((s1, s2, 0))

    # If we still need more pairs, generate combinations more aggressively
    if len(pairs) < n:
        for t1 in topics:
            for t2 in topics:
                if t1 >= t2:
                    continue
                for s1 in TOPIC_SENTENCES[t1]:
                    for s2 in TOPIC_SENTENCES[t2]:
                        key = (s1, s2) if s1 < s2 else (s2, s1)
                        if key not in seen:
                            seen.add(key)
                            pairs.append((s1, s2, 0))
                            if len(pairs) >= n:
                                break
                    if len(pairs) >= n:
                        break
                if len(pairs) >= n:
                    break
            if len(pairs) >= n:
                break

    random.shuffle(pairs)
    return pairs[:n]


def _apply_transforms(text: str, num_transforms: int = 2) -> str:
    """Apply multiple random transforms to produce a paraphrase."""
    result = text
    chosen = random.sample(TRANSFORMS, min(num_transforms, len(TRANSFORMS)))
    for fn in chosen:
        result = fn(result)
    # Ensure the result ends with punctuation
    result = result.strip()
    if result and result[-1] not in ".!?":
        result += "."
    return result


def generate_paraphrased_pairs(n: int) -> list[tuple[str, str, int]]:
    """
    Label 1 — paraphrased pairs: same meaning, different wording.
    Apply 2-3 transforms to each original sentence.
    """
    flat = _all_sentences_flat()
    pairs: list[tuple[str, str, int]] = []
    seen_originals: set[int] = set()

    # We may need to cycle through sentences multiple times with different
    # random transforms to get enough pairs.
    cycle = 0
    while len(pairs) < n:
        cycle += 1
        order = list(range(len(flat)))
        random.shuffle(order)
        for idx in order:
            if len(pairs) >= n:
                break
            _, original = flat[idx]
            num_t = random.choice([2, 2, 3])  # mostly 2, sometimes 3
            paraphrased = _apply_transforms(original, num_transforms=num_t)
            # Only accept if it's meaningfully different
            if paraphrased.lower().strip() != original.lower().strip():
                pairs.append((original, paraphrased, 1))
        if cycle > 50:  # safety valve
            break

    random.shuffle(pairs)
    return pairs[:n]


def _add_typos(text: str, num_typos: int = 1) -> str:
    """Introduce *num_typos* character-level edits (swap, insert, delete)."""
    chars = list(text)
    for _ in range(num_typos):
        if len(chars) < 5:
            break
        op = random.choice(["swap", "insert", "delete", "replace"])
        # Pick a position away from the first/last char
        pos = random.randint(2, len(chars) - 3)
        if op == "swap" and pos + 1 < len(chars):
            chars[pos], chars[pos + 1] = chars[pos + 1], chars[pos]
        elif op == "insert":
            chars.insert(pos, random.choice(string.ascii_lowercase))
        elif op == "delete":
            chars.pop(pos)
        elif op == "replace":
            chars[pos] = random.choice(string.ascii_lowercase)
    return "".join(chars)


def _partial_copy(text: str, keep_ratio: float = 0.7) -> str:
    """Return a substring keeping *keep_ratio* of the words."""
    words = text.split()
    keep_count = max(3, int(len(words) * keep_ratio))
    if keep_count >= len(words):
        return text
    start = random.randint(0, len(words) - keep_count)
    fragment = " ".join(words[start : start + keep_count])
    # Fix capitalisation and punctuation
    fragment = fragment.strip().rstrip(".,;:!?")
    if fragment:
        fragment = fragment[0].upper() + fragment[1:]
        fragment += "."
    return fragment


def _minor_edit(text: str) -> str:
    """Swap 1-2 words with synonyms (lighter than paraphrase)."""
    return synonym_replace(text, max_replacements=random.choice([1, 2]))


def generate_plagiarized_pairs(n: int) -> list[tuple[str, str, int]]:
    """
    Label 2 — plagiarized pairs with varied plagiarism types.
      ~40% exact copy
      ~25% near-exact (1-2 typos)
      ~20% partial copy (60-80%)
      ~15% minor edit (1-2 synonym swaps)
    """
    flat = _all_sentences_flat()
    n_exact = int(n * 0.40)
    n_near = int(n * 0.25)
    n_partial = int(n * 0.20)
    n_minor = n - n_exact - n_near - n_partial  # remainder ≈ 15%

    pairs: list[tuple[str, str, int]] = []

    def _pick() -> str:
        return random.choice(flat)[1]

    # Exact copies
    for _ in range(n_exact):
        s = _pick()
        pairs.append((s, s, 2))

    # Near-exact (typos)
    for _ in range(n_near):
        s = _pick()
        num_typos = random.choice([1, 1, 2])
        pairs.append((s, _add_typos(s, num_typos), 2))

    # Partial copies
    for _ in range(n_partial):
        s = _pick()
        ratio = random.uniform(0.60, 0.80)
        pairs.append((s, _partial_copy(s, ratio), 2))

    # Minor edits
    for _ in range(n_minor):
        s = _pick()
        pairs.append((s, _minor_edit(s), 2))

    random.shuffle(pairs)
    return pairs[:n]


# ═══════════════════════════════════════════════════════════════════════════════
# 7.  MAIN — ASSEMBLE, SHUFFLE, WRITE
# ═══════════════════════════════════════════════════════════════════════════════

def _escape_csv_field(s: str) -> str:
    """Clean a field for CSV: collapse whitespace, strip."""
    return re.sub(r"\s+", " ", s).strip()


def main() -> None:
    t0 = time.time()
    print("=" * 72)
    print("  SemanticShield — Synthetic Plagiarism Dataset Generator")
    print("=" * 72)
    print()

    # Validate seed pool
    topic_count = len(TOPIC_SENTENCES)
    sentence_count = sum(len(v) for v in TOPIC_SENTENCES.values())
    synonym_count = len(SYNONYM_MAP)
    print(f"  Seed pool     : {sentence_count} sentences across {topic_count} topics")
    print(f"  Synonym dict  : {synonym_count} word mappings")
    print(f"  Target output : {TOTAL_TARGET} pairs  ({TARGET_PER_CLASS} per class)")
    print()

    # Generate each class
    print("[1/4] Generating ORIGINAL (unrelated) pairs  … ", end="", flush=True)
    label0 = generate_original_pairs(TARGET_PER_CLASS)
    print(f"done  ({len(label0)} pairs)")

    print("[2/4] Generating PARAPHRASED pairs            … ", end="", flush=True)
    label1 = generate_paraphrased_pairs(TARGET_PER_CLASS)
    print(f"done  ({len(label1)} pairs)")

    print("[3/4] Generating PLAGIARIZED pairs             … ", end="", flush=True)
    label2 = generate_plagiarized_pairs(TARGET_PER_CLASS)
    print(f"done  ({len(label2)} pairs)")

    # Combine and shuffle
    print("[4/4] Shuffling and writing CSV                … ", end="", flush=True)
    all_pairs = label0 + label1 + label2
    random.shuffle(all_pairs)

    # Ensure output directory exists
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    with open(OUTPUT_FILE, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f, quoting=csv.QUOTE_ALL)
        writer.writerow(["text1", "text2", "label"])
        for t1, t2, lbl in all_pairs:
            writer.writerow([_escape_csv_field(t1), _escape_csv_field(t2), lbl])

    print(f"done")
    print()

    # Summary statistics
    elapsed = time.time() - t0
    counts = {0: 0, 1: 0, 2: 0}
    for _, _, lbl in all_pairs:
        counts[lbl] += 1

    print("-" * 72)
    print("  SUMMARY")
    print("-" * 72)
    print(f"  Label 0 (Original)     : {counts[0]:>6}")
    print(f"  Label 1 (Paraphrased)  : {counts[1]:>6}")
    print(f"  Label 2 (Plagiarized)  : {counts[2]:>6}")
    print(f"  -----------------------------")
    print(f"  Total pairs            : {len(all_pairs):>6}")
    print(f"  Output file            : {OUTPUT_FILE}")
    print(f"  File size              : {OUTPUT_FILE.stat().st_size / 1024:.1f} KB")
    print(f"  Elapsed time           : {elapsed:.2f}s")
    print("-" * 72)

    # Validation
    assert len(all_pairs) >= TOTAL_TARGET, (
        f"Generated {len(all_pairs)} pairs, need >= {TOTAL_TARGET}"
    )
    for lbl in (0, 1, 2):
        assert counts[lbl] >= TARGET_PER_CLASS, (
            f"Label {lbl}: {counts[lbl]} pairs, need >= {TARGET_PER_CLASS}"
        )

    print("\n  All validations passed.  Dataset is ready.\n")


if __name__ == "__main__":
    main()

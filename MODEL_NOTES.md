# Cellula — model and development notes

An interactive 3D educational cell sandbox connecting biology, chemistry, and physics.

## Use

The application is buildless. `dist/` contains all runtime files, including a pinned local Three.js 0.160.1 module and its license. It makes no external asset or API requests. Serve `dist/` with any static HTTP server. This export is independent of the original hosting service.

- Drag the cell to rotate; scroll to zoom. Click an organelle or its label to inspect it.
- Switch between Biology, Chemistry, and Physics. All views share a single computed state.
- Choose an experiment preset to start a fresh reference cell with a perturbed bath.
- Adjust sliders during a run to perform step experiments without resetting the cell.
- Pause/resume, choose 1×/5×/20× simulated speed, or reset to reference conditions.
- Review ATP, membrane potential, and a selectable mechanical signal (volume, tension, or pore opening) over the last 120 simulated seconds.
- Use the Membrane lab to change stretch stiffness (mN/m), bending rigidity (kBT), ion-pore target opening/selectivity, stretch gating, and relative water permeability.
- Inspect passive vs pump Na/K/Cl fluxes, elastic pressure, area stretch, and the calculated single-mode ripple scale.
- Toggle illustrative motion and transport. Reduced-motion settings are respected. Numerical pause also freezes illustrative time.
- Export CSV with sampled state, fluxes, units, and the conditions at each sample.
- Read the in-app Model & equations panel for formulas, constants, assumptions, and scientific sources.

## Model and implementation

`dist/model.js` is independent of rendering and the DOM. It exports `initialState()`, `observe(state, parameters)`, and `advance(state, parameters, dt)`. State contains ion and ATP amounts, relative volume, dynamic pore opening, and simulated time. The numerical solver is fourth-order Runge–Kutta, with a 0.04 s maximum step in the UI. The fixed negative impermeant pool and quasi-steady current balance preserve bulk electroneutrality. ATP and ADP share a fixed adenylate pool.

The generic pump-leak architecture is informed by Kay (2017), *How Cells Can Control Their Size by Pumping Ions*, https://doi.org/10.3389/fcell.2017.00041. The reduced energy module and its numerical parameters are illustrative choices, not a reproduction of that paper or a fitted whole-cell model. Metabolic background: Cooper, *The Cell: A Molecular Approach*, https://www.ncbi.nlm.nih.gov/sites/books/NBK9903/.

`dist/scene.js` renders real WebGL meshes and projects selectable labels. Cell radius follows the cube root of computed volume. The chemistry particles illustrate bulk ATP availability; they do not solve particle trajectories. Water arrows follow net computed flux; membrane tint illustrates voltage. Decorative organelles do not add unmodeled biochemical calculations. Rendering failure leaves the model, controls, and plots functional with an explanatory message.

`dist/app.js` owns controls, fixed simulation stepping, presets, readouts, inspector, plots, and CSV export. Changing parameters preserves cell state; choosing a preset resets it. A hidden tab suspends simulation without accumulating missed time. Model-domain excursions stop a run rather than silently clamping state.

## Membrane mechanics and transport (v0.2)

The spherical surface carries tensile tension `sigma = KA * max(0, (V/V0)^(2/3)/(1+reserve/100)-1)` and contributes Laplace back pressure `2*sigma/radius` against osmotic water flow. KA is an illustrative effective shell modulus; this is not a calibrated lipid membrane/cortex or a full shape solver. No rupture is simulated. Large tension/area changes are explicitly identified as outside intact-bilayer interpretation.

A separate bending coefficient controls the calculated equipartition amplitude of one l=6 spherical mode: `R / sqrt(1680*kappa/kBT + 40*sigma*R^2/kBT)`. The 3D ripple pattern shows this coefficient at 3x magnification, using deterministic motion. It is not a total RMS amplitude, a stochastic trajectory, or a bending force in the volume equation. Concepts: *Curvature fluctuations of fluid vesicles reveal hydrodynamic dissipation within the bilayer* (2024), https://pmc.ncbi.nlm.nih.gov/articles/PMC11536141/.

Pore population opening is a state variable with a 0.8 s relaxation time. Manual opening can be augmented by tension using an illustrative Hill curve with half-activation at 2 mN/m. Additional conductance is proportional to actual opening and area; broad pores add Na/K/Cl conductance, selective pores only Na or K. This is a generic population model, not resolved pores or fitted channel kinetics. Conceptual stretch-gating reference: Guharay & Sachs (1984), https://pubmed.ncbi.nlm.nih.gov/6086918/.

Water permeability is independent of ion-pore opening and multiplies the water transport coefficient. The transport table distinguishes passive fluxes from the ATP-driven pump; signs are positive inward. Animated Na/K/Cl/water streams follow calculated flux direction and relative magnitude. Particles are illustrative, not molecular trajectories; internal hydrodynamic flow is not solved. Slight organelle drift is illustrative visual motion.

## Validation

Run `node test-model.mjs`. It verifies reference stability for 600 simulated seconds, all thirteen presets, bulk charge conservation, the adenylate-pool domain, correct osmotic water direction, recovery after oxygen restoration, step-size convergence, and thirty individual control-limit runs, elastic resistance, bending response, pore selectivity, gate kinetics, and water transport. Syntax checks: `node --check dist/app.js` and `node --check dist/scene.js`.

## Scope for iteration

The current model has cytosolic and mitochondrial energy compartments and a clamped bath. No explicit substrate uptake, plasma-membrane capacitance, calcium, pH, gene regulation, alternative fuels, adaptation, or cell death is solved. Geometry is schematic and cell properties are not calibrated to a named cell type. Temperature changes Nernst potentials and Q10 factors, with no heat-injury model. Valid volume is 0.45–1.8× reference.

Potential next modules: full membrane deformation and cortex mechanics; membrane rupture/repair with area reserves; spatial diffusion and cytoplasmic flow; cytosol/mitochondria compartment transport; proton balance and pH; mitochondrial membrane potential; a specific cell type with cited parameter data; saved experiments and comparison of runs. Keep new processes in the model module with explicit units, conservation assumptions, and checks before connecting them to rendering.

## v0.3 — mammalian compartmental energetics

Adds cytosolic (90%) and matrix (10%) volumes, separate adenylate pools (4.5 and 0.5 mM × V0), ATP/ADP counter-exchange, an effective mitochondrial potential state, respiratory drive, synthesis and proton leak. Adds area reserve before membrane stretching. The equations and coefficient values are documented in the app. These are new reduced illustrative equations inspired by chemiosmosis, not a port of Beard 2005, a calibrated cell type, or a fully thermodynamically balanced mitochondrial model. Plasma ion concentrations still use effective whole-cell volume. pH, NADH, phosphate, explicit oxygen consumption, cortical forces and published experimental benchmark reproduction remain outstanding.

New presets: mitochondrial uncoupling, respiratory inhibition, and ATP exchange restriction. The energy chart selects cytosolic ATP, matrix ATP, or potential magnitude. CSV includes new state/flux/parameter fields. Tests check all presets, both ends of 15 controls, timestep convergence, exchange conservation, compartment divergence, potential loss and membrane-area reserve.

Reference: Beard (2005), https://pmc.ncbi.nlm.nih.gov/articles/PMC1201326/. Published-model reproduction and experimental calibration are explicitly marked as unverified in the interface.


## v0.4 — Stable isotope tracing
Added C, N, S, Cu, Zn, Ca, Fe, Mg and Se with selected stable isotope identities checked against NIST (https://pml.nist.gov/cgi-bin/Compositions/stand_alone.pl?ascii=ascii). Each element retains a separate pulse–chase run. Pulse adds 100 normalized labelled units; wash transfers remaining bath label into an accounted discarded pool. All elements use the same illustrative linear compartment rates, explicitly disclosed in the UI. Exact pairwise exchange substeps preserve positivity and total label. This is operator splitting, not an exact full-system solution. Timestep convergence is checked.

Tracer pools: finite bath, mobile cytosol, retained/bound proxy and generic organelle. Tracer amounts represent excess tagged material above an unmodelled background; no total elemental concentrations or natural abundance are inferred. Molecular carriers, metabolic atom mapping, oxidation states, isotope effects and biological feedback are not yet solved. No additional ATP, calcium-signalling, toxicity or membrane effects are claimed. Run time follows the main numerical clock; main reset/preset clears runs. Export includes all element histories, transport settings and pulse/wash events. Switching isotopes clears that element run.

Validation: `node test-tracers.mjs` checks 108 rate combinations, positivity, atom conservation including removed label, wash accounting, blocked transport and timestep convergence; existing model tests pass. Browser preview remains unavailable because the managed preview daemon is absent.


## v0.5 — Paired molecule and isotope experiments
New isotope-model.js/isotope-lab.js provide 10 carrier profiles covering C, N, S, Cu, Zn, Ca, Fe, Mg and Se. Glucose and cholesterol have separate carbon pathways; glutamine and methionine have lumped nitrogen/sulfur pathways; metals and selenium have explicitly generic pools. Heavy/light atom inventories are conserved separately, including bath replacement ledgers. Pulse replaces bath composition at fixed total inventory. Chase returns the bath to the starting pair composition. Representative NIST abundances are renormalized to the selected pair; omitted isotopes are not tracked. No molecular isotopologue distributions or kinetic isotope effects are inferred.

All starting inventories and kinetic coefficients are illustrative. Readouts are µM element-equivalent per whole-cell volume, not physiological free-ion or membrane concentrations. CO2 is an accumulated carbon sink. Glucose oxidation responds to bath oxygen using an illustrative saturation factor. Other main-model inputs affect tracer concentrations through cell volume only. The tracer module has no feedback on main ATP, electrical or membrane dynamics.

Each carrier has a matched reference with the same pulse/chase schedule and initial state, but fixed reference transport/processing/storage rates, reference volume and reference oxygen. Neither finite-bath trajectory is asserted to be a physiological steady state. Experiment rate edits affect only the experiment; changing carrier preserves both runs. Comparison exports retain every pool, isotope amounts, volumes, rates, oxygen, and isotope input/output ledgers at sampled times.

The prominent reference-conditions button restores all main parameters and paired-lab rate multipliers while preserving cell state and histories. Reset/preset starts new runs. Main readouts compare ATP, volume and voltage against the chosen reference cell. Generic v0.4 tracer lab remains a separate exploratory module.

Validation: node test-isotopes.mjs, node test-tracers.mjs, node test-model.mjs. Tests cover all nine elements / ten carriers, separate atom conservation, positivity, dose replacement, chase, matched references, dilution, convergence, oxygen-sensitive carbon oxidation and cholesterol label reaching the membrane proxy. Browser QA is unavailable due to the absent managed-preview daemon.


## v0.6 — Reference comparison and isotope tones
Adds an explicitly hypothetical tumour-like scenario and a 0–4× expression proxy mapping linearly to glucose/glutamine transport and processing. Not a calibrated MYC model, normal/cancer classifier, or universal tumour signature. Other carriers have no gene coupling. Reference trajectories retain 1× rates with identical isotope pulses. Rate changes preserve history. Selected-pool charts support heavy fraction, total inventory density and heavy inventory density, each with a dashed reference. Main cell charts retain a now higher-contrast fixed reference. Paired composition discs display experiment and reference fractions.

A 3D overlay uses 100 deterministic dark/light markers to encode selected-pool isotope composition (rounded to 1 percentage point). Marker count does not encode inventory and marker positions are schematic, not resolved spatial distributions or trajectories. Membrane cholesterol uses a rim placement; bath/collected pools use an outside ring; other pools use a generic interior disk. There is no isotope-flow animation. Existing ion-flow animation remains distinct. Main ATP and mechanics are not coupled to the expression proxy.

Numerical model checks pass. Managed browser preview remains unavailable.


## v0.7 — Visible cell identity and gene hypothesis panel
Top-of-page named MYC and KRAS expression sliders, p53 functional-activity slider, KRAS oncogenic toggle and p53 loss-of-function toggle. Explicit hypothesis coefficients are shown in the UI and genes.js; they are not fitted expression-to-flux relationships. The p53 glucose factor is only a sensitivity hypothesis, not a TIGAR/PPP implementation. Tumour example combines MYC 2×, oncogenic KRAS and loss of p53 function; it does not identify a validated tumour cell line. P-gp remains explicitly unimplemented. Main ATP/mechanics have no gene feedback. Other element profiles retain baseline rates.

Named gene controls supersede the hidden generic expression proxy; direct rate selectors are read-only to prevent conflicting state. Pair restart retains gene settings, resets the selected isotope pair and pulses both arms. Reference genes/rates remain at 1×/WT. Whole-cell reset restores reference genes. CSV snapshots include gene settings alongside actual rates; reference rows contain reference genes. Checks: test-genes.mjs, test-isotopes.mjs, test-model.mjs. Browser verification unavailable (managed preview daemon missing).


## English interface and experiment guidance
All remaining Cyrillic user-facing text translated to English. The gene panel now follows three steps: choose scenario, adjust genes, choose a gene-linked tracer and start comparison. Tracer selection is available beside the start button; launching selects and resets that pair, preserves other runs, resumes a paused simulation unless the cell-domain boundary has been reached, and scrolls to results (respecting reduced-motion preference). The separate generic tracer sandbox is collapsed under Advanced, and calculated read-only rates are in a disclosure. Scientific caveats remain visible; detailed equations remain expandable. No numerical coefficients changed.

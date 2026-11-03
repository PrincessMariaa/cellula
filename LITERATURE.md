# Cellula: literature and implementation provenance

Updated 3 November 2026. Applies to the exported Cellula model with MYC/KRAS/p53 hypothesis controls.

**Cellula is literature-informed, not literature-validated.** No published model was reproduced in full and no experimental curves were fitted. Numerical conservation/stability tests are not evidence of biological predictive accuracy. References below explain design choices; they do not validate our chosen rate constants.

## Sources informing implemented features

| Source | How it was used in Cellula | What was not taken from it |
|---|---|---|
| **Kay AR (2017). How Cells Can Control Their Size by Pumping Ions.** [Article](https://pmc.ncbi.nlm.nih.gov/articles/PMC5420573/); DOI: 10.3389/fcell.2017.00041. | Conceptual foundation for coupling passive Na/K/Cl fluxes, the ATP-powered Na/K pump, osmotic water movement and cell volume in `dist/model.js`. | Not a verbatim implementation. Conductances, kinetic constants, reference state and quasi-steady voltage implementation are our reduced choices; published results have not been reproduced. |
| **Curvature fluctuations of fluid vesicles reveal hydrodynamic dissipation within the bilayer (2024).** [Article](https://pmc.ncbi.nlm.nih.gov/articles/PMC11536141/). | Motivated distinguishing bending rigidity from stretching and relating visible fluctuations to bending stiffness. The model uses a reduced single spherical-mode amplitude and enlarged visual ripples. | The full fluctuation spectrum and hydrodynamic dissipation model are not implemented. Our periodic animation is not a stochastic trajectory or a parameter fit to this paper. |
| **Guharay F, Sachs F (1984). Stretch-activated single ion channel currents in tissue-cultured embryonic chick skeletal muscle.** [Article](https://pubmed.ncbi.nlm.nih.gov/6086918/); DOI: 10.1113/jphysiol.1984.sp015317. | Experimental motivation for allowing membrane tension to increase pore opening. | This is chick muscle, not a mammalian-cell calibration. Cellula's Hill curve, half-activation tension, conductance and 0.8 s gating time are illustrative, not fitted to this study. |
| **Beard DA (2005). A Biophysical Model of the Mitochondrial Respiratory System and Oxidative Phosphorylation.** [Article](https://pmc.ncbi.nlm.nih.gov/articles/PMC1201326/); DOI: 10.1371/journal.pcbi.0010036. [Correction](https://pmc.ncbi.nlm.nih.gov/articles/PMC1356095/). | Conceptual guidance for separate matrix/cytosolic ATP pools, mitochondrial potential, respiration, proton leak and ATP/ADP exchange. Also a candidate for a future rigorous replacement. | Cellula does not implement Beard's reaction network or thermodynamic model. The potential relaxation, ATP synthesis and exchange laws are new phenomenological equations; pH, NADH, phosphate and respiratory complexes are omitted. |
| **Simultaneous tracing of carbon and nitrogen isotopes in human cells (2016).** [Article](https://pmc.ncbi.nlm.nih.gov/articles/PMC4879607/); DOI: 10.1039/C6MB00009F. | Motivated using labelled molecular carriers, separate carbon/nitrogen tracing, and comparing isotope composition across pools in `dist/isotope-model.js`. | No mass-spectrometry data or measured fluxes were imported. Cellula tracks marginal heavy/light atom inventories, not the paper's multivariate mass-isotopomer distributions or detailed reaction network. |
| **Reprogramming of proline and glutamine metabolism contributes to the proliferative and metabolic responses regulated by oncogenic transcription factor c-MYC (2012).** [Article](https://pmc.ncbi.nlm.nih.gov/articles/PMC3384197/). | Qualitative motivation for linking MYC to glutamine uptake/processing and for comparing labelled glutamine under different MYC settings in `dist/genes.js`. | The P493 experiments, proline pathway and measured labelling data are not reproduced. The MYC factor `0.5 + 0.5 × expression` is our hypothesis, not a published estimate. This paper is not quantitative support for the separate glucose multiplier. |
| **Ying et al. (2012). Oncogenic Kras Maintains Pancreatic Tumors through Regulation of Anabolic Glucose Metabolism.** [Article](https://pmc.ncbi.nlm.nih.gov/articles/PMC3472002/); DOI: 10.1016/j.cell.2012.01.058. | Motivated a qualitative connection between oncogenic KRAS and glucose transport/processing, with mutation state separate from expression. | No pancreatic-tumour calibration, PPP or glycosylation network is implemented. The KRAS expression coefficient 0.25 and oncogenic increment 0.5 are invented sensitivity parameters, not effect sizes from this article. |
| **Bensaad et al. (2006). TIGAR, a p53-Inducible Regulator of Glycolysis and Apoptosis.** [Article](https://pubmed.ncbi.nlm.nih.gov/16839880/). | Motivation for exploring a possible p53-associated effect on glucose processing and distinguishing p53 activity from protein abundance. | TIGAR, fructose-2,6-bisphosphate, PPP, ROS and apoptosis are not simulated. The factor `1.25 / (1 + 0.25 × p53 activity)` is a hypothesis, not an experimentally established general p53 response. Loss of p53 function is not a model of every TP53 mutation. |

## Reference data rather than a research article

**NIST: Atomic Weights and Isotopic Compositions for All Elements.** [Database](https://pml.nist.gov/cgi-bin/Compositions/stand_alone.pl?ascii=ascii), checked 3 November 2026.

Used directly for isotope identities and representative isotope abundances. `dist/isotope-model.js` uses the displayed heavy/light pair only: when other isotopes exist, abundances are renormalized to that pair. For example, the 25Mg/24Mg heavy fraction is `0.1000 / (0.1000 + 0.7899)`, not the abundance of 25Mg in complete natural magnesium. This is a two-isotope simplification. NIST provides no cellular transport rates or isotope-specific biological effects.

## Literature reviewed for future development, not implemented models

- **Jiang H, Sun SX (2013). Cellular Pressure and Volume Regulation and Implications for Cell Mechanics.** [Article](https://pmc.ncbi.nlm.nih.gov/articles/PMC3736675/). Identified as a candidate framework for coupling cortex mechanics, pressure, water and ions. Cellula currently uses a simple spherical elastic shell; it does not reproduce this cortex model.
- **Son et al. (2013). Glutamine supports pancreatic cancer growth through a KRAS-regulated metabolic pathway.** [Article](https://pmc.ncbi.nlm.nih.gov/articles/PMC3656466/). Informed the discussion of cell-type-specific KRAS/glutamine pathways. No corresponding glutamine enzyme network or KRAS-to-glutamine coupling is implemented in the current gene module.
- **Glucose-independent glutamine metabolism via TCA cycling for proliferation and survival in B-cells (2012).** [Article](https://pmc.ncbi.nlm.nih.gov/articles/PMC3345194/). Proposed as a future MYC ON/OFF isotope-tracing benchmark. Its experiments have not yet been reproduced by Cellula.
- **NCBI Gene: ABCB1.** [Record](https://www.ncbi.nlm.nih.gov/gene/5243). Used to establish that P-gp needs an appropriate substrate and ATP-dependent transport model. P-gp remains unimplemented; it does not currently remove any tracer.

## Features that do not yet have a quantitative literature basis

- All carrier-specific tracer transfer coefficients and initial pool amounts are illustrative. No cited paper supplies our cholesterol, sulfur, metal or selenium uptake/binding/storage rates.
- Generic metal pools do not resolve oxidation states, ligands, free-ion concentrations or individual transporters. Calcium tracing is not calcium signalling.
- The membrane area reserve, stretch modulus, gate parameters and many energetic constants are selected demonstration parameters, not a shared physiological reference for mammalian cells.
- Nernst potentials, osmotic pressure, Laplace pressure and atom accounting use general physical/mass-balance principles. Their use does not establish biological calibration.
- The normal-like reference is a chosen generic baseline. The oncogenic example combines MYC 2×, an illustrative KRAS variant and p53 loss of function; it is not a validated healthy-versus-cancer cell comparison.
- Isotope markers show calculated composition in schematic locations, not measured spatial concentration fields or molecular trajectories. No kinetic isotope effects are assumed.
- Genes change the tracer model's selected rates; they do not feed back into main-cell ATP, membrane mechanics, proliferation or death.

## What has actually been checked

The included tests check numerical reference stability, conservation, nonnegative pools, selected perturbation responses and timestep convergence. They do **not** establish agreement with measured mammalian-cell behaviour.

The next validation step is to select one experimental cell system, reproduce a published tracer experiment and quantify disagreement with its data before adding stronger predictive claims.

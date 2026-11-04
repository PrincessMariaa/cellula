# Cellula: equations, reasoning and scientific status

Code-matched documentation, 3 November 2026. Read with [LITERATURE.md](LITERATURE.md). Describes `dist/model.js`, `dist/isotope-model.js`, `dist/tracers.js` and `dist/genes.js`; it does not introduce a new validated model.

**Status key:** **Physical relationship** = established law under its stated assumptions; **reduced approximation** = simplified application; **illustrative hypothesis** = a chosen functional form or coefficient without experimental calibration. Combining physical laws with invented kinetics does not make the whole model quantitatively predictive.

## 1. State, compartments and units

Let $v=V/V_0$, with reference radius $r_0=10\,\mu m$ and $V_0\approx4.19$ pL. Main-model amounts $n_i$ are expressed as mM × reference volume (numerically mM when $v=1$). The normalized concentration is

$$c_i=n_i/v.$$

ATP has separate cytosolic and matrix compartments, whose fixed volume fractions are 0.9 and 0.1:

$$[ATP]_c=a_c/(0.9v),\quad [ADP]_c=(4.5-a_c)/(0.9v),$$
$$[ATP]_m=a_m/(0.1v),\quad [ADP]_m=(0.5-a_m)/(0.1v).$$

The initial state is $v=1$, $n_{Na}=15$, $n_K=135$, $a_c=2.7$, $a_m=0.4$, mitochondrial potential magnitude $\psi=150$ mV, and gate opening $h=0$.

**Reasoning:** conserve amounts while allowing dilution during swelling. **Assumptions:** fixed compartment fractions; ion concentrations use effective whole-cell volume. Adenylate pools are fixed; de novo nucleotide synthesis is absent.

## 2. Ion gradients and membrane voltage

At absolute temperature $T$, the Nernst potential is

$$E_i=\frac{RT}{z_iF}\ln\frac{c_{i,out}}{c_{i,in}}.$$

Multiply by 1000 for mV. $z_{Na}=z_K=1$, $z_{Cl}=-1$. This is an equilibrium electrochemical relation, not a claim that the actual membrane is at equilibrium.

The model's Ohmic equivalent currents are

$$j_i=g_i(V_m-E_i).$$

With instantaneous electrical relaxation, total current is zero:

$$j_{Na}+j_K+j_{Cl}+P=0,$$
$$V_m=\frac{g_{Na}E_{Na}+g_KE_K+g_{Cl}E_{Cl}-P}{g_{Na}+g_K+g_{Cl}}.$$

Here $P$ is pump-cycle flux: each cycle moves 3 Na outward and 2 K inward. Consequently,

$$\dot n_{Na}=-j_{Na}-3P,\quad\dot n_K=-j_K+2P,\quad\dot n_{Cl}=j_{Cl}.$$

The chloride sign differs because current and anion movement have opposite signs. Currents are expressed in equivalent mM × $V_0$/s, not amperes; conductances therefore have corresponding amount-rate/mV units.

**Reasoning:** couple chemical gradients, electrical forces and pumping. **Basis:** Nernst and current balance; pump–leak architecture informed by [Kay (2017)](https://pmc.ncbi.nlm.nih.gov/articles/PMC5420573/). **Limit:** no membrane capacitance, action potentials or spatial electrical field.

### Pump kinetics and reference construction

With $A=v^{2/3}$, $q=2^{(T_C-37)/10}$, inhibition fraction $b$, and concentrations in mM:

$$P=0.025Aq(1-b)
\frac{[ATP]_c/(1+[ATP]_c)}{3/4}
\frac{[Na]_c^3/(10^3+[Na]_c^3)}{15^3/(10^3+15^3)}
\frac{[K]_o/(1+[K]_o)}{5/6}.$$

**Illustrative hypothesis:** saturating factors represent limited binding/turnover; constants and normalization were chosen to give a convenient reference, not fitted to pump measurements.

Define $\theta=RT_0/F$ in mV at $T_0=310.15$ K. Initially $n_{Cl,0}=145e^{-70/\theta}$, and the fixed impermeant amount is $X=150-n_{Cl,0}$. Baseline conductances are

$$g_{Na,0}=\frac{3(0.025)}{\theta\ln(145/15)+70},\quad
g_{K,0}=\frac{2(0.025)}{-70-\theta\ln(5/135)},\quad g_{Cl,0}=0.001.$$

These explicitly construct a balanced reference near −70 mV; they are not measured conductances. Bath values are $[Na]_o=150C_o/300-[K]_o$ and $[Cl]_o=145C_o/300$. Omitted bath species provide the remaining composition/charge balance.

## 3. Osmosis, mechanics and volume

$$C_{in}=\frac{n_{Na}+n_K+n_{Cl}+X}{v},\quad
\Delta\Pi=RT(C_{in}-C_o)/1000.$$

Osmolarity is in mOsm/L, numerically mol/m³; pressure is in kPa. This is the ideal dilute-solution osmotic-pressure approximation. ATP, metabolites and tracer inventories are not explicitly added to this osmotic sum.

For membrane area reserve fraction $\rho$ and effective stretch stiffness $K_A$:

$$\epsilon_A=\max\left(0,\frac{v^{2/3}}{1+\rho}-1\right),\quad
\sigma=K_A\epsilon_A,\quad r=10v^{1/3},\quad\Delta P_{elastic}=2\sigma/r.$$

With $\sigma$ in mN/m and $r$ in µm, the last pressure is in kPa. Laplace pressure is a physical spherical-interface relation; the effective elastic shell, linear tension law and reserve are approximations. No cortex, rupture or trafficking is solved.

$$\dot v=0.18L_w A\frac{\Delta\Pi-\Delta P_{elastic}}{RT(300)/1000}.$$

**Reasoning:** water moves down the net pressure imbalance. $L_w$ is a relative control; 0.18 s⁻¹ is illustrative. Larger permeability changes relaxation speed. The pressure–volume literature, including [Jiang & Sun (2013)](https://pmc.ncbi.nlm.nih.gov/articles/PMC3736675/), motivates a future fuller model; their cortex equations are not implemented here.

## 4. Gates and bending

Let $u$ be manual pore opening and $s\in\{0,1\}$ enable stretch gating:

$$h_* = u+(1-u)s\frac{\sigma^2}{2^2+\sigma^2},\quad
\dot h=(h_*-h)/0.8.$$

$$g_{pore}=0.006Ah\,1.3^{(T_C-37)/10}.$$

This is added to selected ion conductances; base conductances also scale by area and the same leak temperature factor. Broad pores add Na/K/Cl conductance; selective modes add Na or K only. **Illustrative hypothesis:** Hill coefficient 2, half-activation 2 mN/m and 0.8 s relaxation are not measured here. [Guharay & Sachs (1984)](https://pubmed.ncbi.nlm.nih.gov/6086918/) motivates mechanosensitive gating, not these coefficients.

The displayed single-mode fluctuation amplitude is

$$u_6=\frac{r}{\sqrt{1680\,\kappa/(k_BT)+40\sigma r^2/(k_BT)}}.$$

Use SI units inside the expression and convert length to nm. The bending control supplies $\kappa/(k_BT)$. For spherical mode $l=6$, $(l-1)(l+2)=40$ and $l(l+1)=42$, giving 1680. This is a reduced equipartition scaling, not total membrane roughness. The animation enlarges it 3× and uses periodic motion; no stochastic dynamics or bending force enters the volume ODE. [Vesicle fluctuation study (2024)](https://pmc.ncbi.nlm.nih.gov/articles/PMC11536141/) supplies conceptual context, not a reproduced spectrum.

## 5. Mitochondrial and cytosolic ATP

Define substrate saturation factors

$$G=\frac{[glucose]}{1+[glucose]},\quad O=\frac{[O_2]}{0.01+[O_2]},\quad D=\frac{[ADP]_c}{0.5+[ADP]_c}.$$

The following are **phenomenological hypotheses**, not Beard's equations:

$$J_{gly}=0.1GDq[1+2(1-O)],$$
$$R_{drive}=\frac{G}{5/6}\frac{O}{0.2/0.21}c_R
\frac{\max(0,1-\psi/220)}{1-150/220}q,$$
$$J_{syn}=\frac49\frac{[ADP]_m/(0.5+[ADP]_m)}{2/3}
\max(0,(\psi-60)/90)qv,$$
$$J_{ex}=\frac{20}{9}e\left(\frac{a_m}{0.5}-\frac{a_c}{4.5}\right)v,$$
$$\dot\psi=30\left[R_{drive}-0.85\frac{J_{syn}}{(4/9)v}-0.15\ell\frac{\psi}{150}\right].$$

$c_R$ is respiratory capacity/100, $e$ is relative exchange and $\ell$ relative proton leak. $R_{drive}$ is dimensionless, not oxygen consumption. $\psi$ is the positive magnitude of matrix-negative voltage; the display uses its negative sign.

Maintenance ATP use is

$$J_{use}=0.5390653\,d q\frac{[ATP]_c/(0.3+[ATP]_c)}{3/3.3},$$

where $d$ is demand. The coefficient is rounded here; code calculates it from reference supply minus reference pump use. Amount balances are

$$\dot a_c=0.9v(J_{gly}-J_{use})+J_{ex}-P,\quad
\dot a_m=J_{syn}-J_{ex}.$$

$J_{gly}$ and $J_{use}$ use cytosolic mM/s; $J_{syn}$ and $J_{ex}$ use mM × $V_0$/s. Equal-and-opposite exchange preserves total ATP across compartments when considered alone. ATP production/use interconverts fixed ATP/ADP pools.

**Reasoning:** substrate availability and ADP regulate production; respiration builds potential, leak and synthesis reduce it. **Limit:** no explicit proton, charge or free-energy accounting. [Beard (2005)](https://pmc.ncbi.nlm.nih.gov/articles/PMC1201326/) inspired the architecture; its thermodynamically constrained model is not reproduced. Reference pool sizes and kinetic coefficients are illustrative.

## 6. Molecular isotope tracing: separate atom ledgers

For pool $i$, track heavy atoms $H_i$ and light atoms $L_i$ in µmol/L of reference-cell volume. For each directed connection $i\to j$ with effective first-order rate $k$:

$$\dot H_i=-kH_i,\quad\dot H_j=kH_i,$$

and identically for $L$. One numerical substep transfers

$$\Delta H=H_i(1-e^{-k\Delta t}),\quad\Delta L=L_i(1-e^{-k\Delta t}).$$

**Reasoning:** preserve nonnegative inventories and conserve each isotope. The same rate for both means no kinetic isotope effect is assumed. Each edge substep is exact, but sequential application across a network is operator splitting, not an exact full-network solution.

Readouts are

$$c_H=H_i/v_i,\quad c_L=L_i/v_i,\quad c_{total}=(H_i+L_i)/v_i,$$
$$f_H=\frac{H_i}{H_i+L_i},\quad R_{H/L}=\frac{H_i}{L_i}.$$

$v_i=v$ for intracellular pools and 1 for bath/collected CO₂ inventories. These are element-equivalent densities, not free-ion concentrations or membrane lipid concentrations. A zero light amount gives an undefined/infinite ratio; an empty pool has no physically meaningful isotope fraction even though the code displays zero.

Initial inventories are 100 (bath), 20 (mobile pool) and 10 (each other pool). Starting isotope fractions use [NIST](https://pml.nist.gov/cgi-bin/Compositions/stand_alone.pl?ascii=ascii), renormalized to the selected pair when necessary. All starting amounts and transport coefficients are illustrative. Complete carrier-specific edge lists are in `profiles` in `dist/isotope-model.js`.

Examples: glucose carbon flows from bath to cell glucose, then pyruvate, branching to lactate or collected CO₂. Six carbons per glucose versus three per pyruvate imply two pyruvates per glucose in carbon accounting, but individual isotopologues are not tracked. Cholesterol preserves its 27-carbon moiety across free, membrane and ester-storage pools. Glutamine tracks both nitrogen atoms into lumped transferred/protein nitrogen; positional nitrogen chemistry is absent.

The glucose oxidation edge additionally uses

$$k_{ox}=0.008\,m_{processing}\frac{[O_2]/(0.01+[O_2])}{0.2/0.21}.$$

No ATP yield is calculated from this tracer edge. Main-cell ATP and tracer carbon are separate models.

### Pulse, chase and conservation

A pulse replaces bath composition at fixed total bath amount $B$:

$$H_b=f_{pulse}B,\quad L_b=(1-f_{pulse})B.$$

Old atoms are recorded as removed; new atoms as added. Chase uses the starting pair fraction instead of the enriched fraction. For each isotope:

$$\sum_i H_i+H_{removed}-H_{added}=H_{initial}.$$

The reference receives the same replacements but retains baseline rates, volume and oxygen. This isolates the modelled perturbation; it does not establish a physiological healthy control. [Carbon/nitrogen tracing in human cells (2016)](https://pmc.ncbi.nlm.nih.gov/articles/PMC4879607/) motivates carrier-based tracing, but its mass-isotopomer distributions are not implemented.

## 7. Gene controls: explicitly hypothetical mappings

Let $x_M,x_K$ be relative MYC/KRAS expression, $I_K$ indicate the hypothetical oncogenic KRAS variant, and $p$ be p53 activity (zero under loss of function):

$$M=0.5+0.5x_M,\quad K=1+0.25(x_K-1)+0.5I_K,$$
$$m_{glucose,transport}=MK,$$
$$m_{glucose,processing}=MK\frac{1.25}{1+0.25p},$$
$$m_{glutamine,transport}=m_{glutamine,processing}=M.$$

At reference $(x_M,x_K,p,I_K)=(1,1,1,0)$, all multipliers equal 1. Gene multipliers scale tracer edge rates, not main-cell metabolism. Storage remains at 1×; other carriers have no gene coupling.

**Reasoning:** explore qualitative nutrient-flux sensitivity while keeping the reference interpretable. **Scientific limitation:** every numeric mapping here is invented. MYC's offset even leaves 50% modelled flux at zero expression; that is a chosen residual activity, not a knockout prediction. The p53 expression is not a TIGAR or PPP reaction model. No transcriptional delays, saturation of protein expression, apoptosis or tumour growth is solved.

Mechanistic context: [MYC/glutamine (2012)](https://pmc.ncbi.nlm.nih.gov/articles/PMC3384197/), [KRAS/glucose (2012)](https://pmc.ncbi.nlm.nih.gov/articles/PMC3472002/), [p53/TIGAR (2006)](https://pubmed.ncbi.nlm.nih.gov/16839880/). None provides these coefficients. P-gp has no implemented equation.

## 8. Other displayed quantities and the generic sandbox

The main activity proxy is

$$activity=100\frac{[ATP]_c/(1+[ATP]_c)}{3/4}e^{-1.5(v-1)^2}.$$

It is neither viability nor proliferation. Dark/light markers use $N_H=\operatorname{round}(100f_H)$ among 100 display markers; marker count is not a concentration measurement and positions are schematic.

The separate Advanced tracer sandbox has no heavy/light background. Its bidirectional pair transfer solves

$$n_a^{eq}=\frac{(n_a+n_b)k_{ba}}{k_{ab}+k_{ba}},\quad
n_a(t+\Delta t)=n_a^{eq}+[n_a(t)-n_a^{eq}]e^{-(k_{ab}+k_{ba})\Delta t},$$

with $n_b$ set by conservation. Rates: bath/mobile 0.025×transport and 0.012×transport; mobile/retained 0.018×retention and 0.003; mobile/organelle 0.008×transport and 0.004×transport (s⁻¹). Pulse adds 100 arbitrary labelled units; chase removes bath label into an accounted discarded pool. This sandbox is independent of gene controls.

## 9. Numerical checks versus biological validation

The main model uses fourth-order Runge–Kutta with a 0.04 s step. It stops outside volume 0.45–1.8, nonnegative ATP bounds, positive ion amounts, gate 0–1 or potential magnitude 0–220 mV. These are computational-domain boundaries, not death thresholds. Tracer substeps share the simulation clock.

Tests check balance, boundedness, reference stability, defined perturbation responses and timestep convergence. They do not compare to measured cells. Next scientific work: pick a cell line and perturbation, implement a reaction/atom-mapping network, fit independently sourced data, test held-out experiments, and report uncertainty and identifiability.

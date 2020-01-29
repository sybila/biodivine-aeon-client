let Examples = {
	g2a: `
		#name:Asymmetric Cell Division A
		#description:<span style="color: rgb(83, 83, 83); font-family: sans-serif, Arial, Verdana, Helvetica; font-size: 13.28px;"><b>Info:</b><br>A fully parametrised version of the asymmetric cell division model. The analysis of the model takes several seconds but should be still very fast. The model has a wide range of behaviour (9 classes in total).<br><br><b>Model description:&nbsp;</b><br><i>Caulobacter crescentus</i></span><span style="color: rgb(83, 83, 83); font-family: sans-serif, Arial, Verdana, Helvetica; font-size: 13.28px;">&nbsp;is a model organism for the study of asymmetric division and cell type differentiation, as its cell division cycle generates a pair of daughter cells that differ from one another in their morphology and behaviour. One of these cells (called stalked) develops a structure that allows it to attach to solid surfaces and is the only one capable of dividing, while the other (called swarmer) develops a flagellum that allows it to move in liquid media and divides only after differentiating into a stalked cell type. Although many genes, proteins, and other molecules involved in the asymmetric division exhibited by&nbsp;</span><i style="color: rgb(83, 83, 83); font-family: sans-serif, Arial, Verdana, Helvetica; font-size: 13.28px;">C. Crescentus</i><font color="#535353" face="sans-serif, Arial, Verdana, Helvetica"><span style="font-size: 13.28px;">&nbsp;have been discovered and characterised&nbsp;during decades, it remains as a challenging task to understand how cell properties arise from the high number of interactions between these molecular components. This chapter describes a modeling approach based on the Boolean logic framework that provides a means for the integration of knowledge and study of the emergence of asymmetric division. The text illustrates how the simulation of simple logic models gives valuable insight into the dynamic behaviour of the regulatory and signalling&nbsp;networks driving the emergence of the phenotypes exhibited by&nbsp;</span></font><i style="color: rgb(83, 83, 83); font-family: sans-serif, Arial, Verdana, Helvetica; font-size: 13.28px;">C. crescentus</i><font color="#535353" face="sans-serif, Arial, Verdana, Helvetica"><span style="font-size: 13.28px;">. These models provide useful tools for the characterisation&nbsp;and analysis of other complex biological networks.</span><br><br><b style="font-size: 13.28px;">Citation:<br></b><span style="font-size: 13.28px;">Sánchez-Osorio, Ismael, Carlos A. Hernández-Martínez, and Agustino Martínez-Antonio. "Modeling Asymmetric Cell Division in Caulobacter crescentus Using a Boolean Logic Approach." Asymmetric Cell Division in Development, Differentiation and Cancer. Springer, Cham, 2017. 1-21.</span><br></font>
		#position:CtrA:419,94
		CtrA -> CtrA
		GcrA -> CtrA
		CcrM -| CtrA
		SciP -| CtrA
		#position:GcrA:325,135
		CtrA -| GcrA
		DnaA -> GcrA
		#position:CcrM:462,222
		CtrA -> CcrM
		CcrM -| CcrM
		SciP -| CcrM
		#position:SciP:506,133
		CtrA -> SciP
		DnaA -| SciP
		#position:DnaA:374,224
		CtrA -> DnaA
		GcrA -| DnaA
		DnaA -| DnaA
		CcrM -> DnaA
	`,

	g2b: `
		#name:Asymmetric Cell Division B
		#description:<span style="color: rgb(83, 83, 83); font-family: sans-serif, Arial, Verdana, Helvetica; font-size: 13.28px;"><b>Info:</b><br></span><span style="color: rgb(83, 83, 83); font-family: sans-serif, Arial, Verdana, Helvetica; font-size: 13.28px;">A parametrised version of the model taken directly from GinSim. The model should be trivial to analyse and have two stable attractors. By changing DivK -| PleC regulation to activating, one can potentially turn the two stable attractors into an oscillating one.<br></span><span style="color: rgb(83, 83, 83); font-family: sans-serif, Arial, Verdana, Helvetica; font-size: 13.28px;"><b><br>Model description:&nbsp;</b><br><i>Caulobacter crescentus</i></span><span style="color: rgb(83, 83, 83); font-family: sans-serif, Arial, Verdana, Helvetica; font-size: 13.28px;">&nbsp;is a model organism for the study of asymmetric division and cell type differentiation, as its cell division cycle generates a pair of daughter cells that differ from one another in their morphology and behaviour. One of these cells (called stalked) develops a structure that allows it to attach to solid surfaces and is the only one capable of dividing, while the other (called swarmer) develops a flagellum that allows it to move in liquid media and divides only after differentiating into a stalked cell type. Although many genes, proteins, and other molecules involved in the asymmetric division exhibited by&nbsp;</span><i style="color: rgb(83, 83, 83); font-family: sans-serif, Arial, Verdana, Helvetica; font-size: 13.28px;">C. Crescentus</i><font color="#535353" face="sans-serif, Arial, Verdana, Helvetica"><span style="font-size: 13.28px;">&nbsp;have been discovered and characterised&nbsp;during decades, it remains as a challenging task to understand how cell properties arise from the high number of interactions between these molecular components. This chapter describes a modeling approach based on the Boolean logic framework that provides a means for the integration of knowledge and study of the emergence of asymmetric division. The text illustrates how the simulation of simple logic models gives valuable insight into the dynamic behaviour of the regulatory and signalling&nbsp;networks driving the emergence of the phenotypes exhibited by&nbsp;</span></font><i style="color: rgb(83, 83, 83); font-family: sans-serif, Arial, Verdana, Helvetica; font-size: 13.28px;">C. crescentus</i><font color="#535353" face="sans-serif, Arial, Verdana, Helvetica"><span style="font-size: 13.28px;">. These models provide useful tools for the characterisation&nbsp;and analysis of other complex biological networks.</span><br><br><b style="font-size: 13.28px;">Citation:<br></b><span style="font-size: 13.28px;">Sánchez-Osorio, Ismael, Carlos A. Hernández-Martínez, and Agustino Martínez-Antonio. "Modeling Asymmetric Cell Division in Caulobacter crescentus Using a Boolean Logic Approach." Asymmetric Cell Division in Development, Differentiation and Cancer. Springer, Cham, 2017. 1-21.</span><br></font>
		#position:DivL:750,160
		DivK -| DivL
		#position:CckA:750,95
		DivL -> CckA
		#position:ChpT:822,95
		CckA -> ChpT
		#position:CtrAb:824,158
		ChpT -> CtrAb
		ClpXP_RcdA -| CtrAb
		#position:ClpXP_RcdA:909,157
		CpdR -| ClpXP_RcdA
		#position:CpdR:909,96
		ChpT -> CpdR
		#position:PleC:611,93
		DivK -| PleC
		#position:DivK:679,160
		PleC -| DivK
		DivJ -> DivK
		#position:DivJ:677,94
		DivK -> DivJ
		PleC -| DivJ
	`,

	buddingYeastOrlando: `
		#name:Budding yeast cell cycle (Orlando)
		#description:<span style="color: rgb(83, 83, 83); font-family: sans-serif, Arial, Verdana, Helvetica; font-size: 13.28px;"><b>Info:</b><br>A fully parametric version of a smaller variant of the budding yeast model from GinSim. The analysis should be computable in several seconds. The model has various types of behaviour, but at most two attractors at the same time.<br><br><b>Model description: </b><br>This model is a direct transcription of the Boolean model published by Orlando et al.&nbsp;</span><a href="http://ginsim.org/node/33#ref1" title="Reference 1" style="color: rgb(119, 119, 119); font-family: sans-serif, Arial, Verdana, Helvetica; font-size: 13.28px;">[1]</a><span style="color: rgb(83, 83, 83); font-family: sans-serif, Arial, Verdana, Helvetica; font-size: 13.28px;">. Synchronous simulation of this model yields a cyclic attractor gathering most trajectories in the state transition graph, which is robust to parameter choice, as reported in&nbsp;</span><a href="http://ginsim.org/node/33#ref1" title="Reference 1" style="color: rgb(119, 119, 119); font-family: sans-serif, Arial, Verdana, Helvetica; font-size: 13.28px;">[1]</a><span style="color: rgb(83, 83, 83); font-family: sans-serif, Arial, Verdana, Helvetica; font-size: 13.28px;">. However, asynchronous simulations all lead to a stable state with all variables OFF, whatever the parameter set proposed by the authors, indicating that the oscillations observed in the synchronous simulations may not be sustained. See&nbsp;</span><a href="http://ginsim.org/node/33#ref2" title="Reference 2" style="color: rgb(119, 119, 119); font-family: sans-serif, Arial, Verdana, Helvetica; font-size: 13.28px;">[2]</a><font color="#535353" face="sans-serif, Arial, Verdana, Helvetica"><span style="font-size: 13.28px;">&nbsp;for more details. </span></font><br><br><b style="color: rgb(83, 83, 83); font-family: sans-serif, Arial, Verdana, Helvetica; font-size: 13.28px;">Citation:</b><br><font color="#535353" face="sans-serif, Arial, Verdana, Helvetica"><span style="font-size: 13.28px;">FAURÉ, Adrien; THIEFFRY, Denis. Logical modelling of cell cycle control in eukaryotes: a comparative study. Molecular BioSystems, 2009, 5.12: 1569-1581.</span></font><br><br>
		#position:CLN3:128,68
		YOX1 -| CLN3
		YHP1 -| CLN3
		ACE2 -> CLN3
		SWI5 -> CLN3
		#position:MBF:219,96
		CLN3 -> MBF
		#position:SBF:281,138
		MBF -> SBF
		YOX1 -| SBF
		YHP1 -| SBF
		CLN3 -> SBF
		#position:YOX1:297,175
		MBF -> YOX1
		SBF -> YOX1
		#position:YHP1:286,254
		MBF -> YHP1
		SBF -> YHP1
		#position:HCM1:305,217
		MBF -> HCM1
		SBF -> HCM1
		#position:SFF:186,302
		SBF -> SFF
		HCM1 -> SFF
		#position:ACE2:74,276
		SFF -> ACE2
		#position:SWI5:47,207
		SFF -> SWI5

	`,

	buddingYeastIrons: `
		#name:Budding yeast cell cycle
		#description:<span style="color: rgb(83, 83, 83); font-family: sans-serif, Arial, Verdana, Helvetica; font-size: 13.28px;"><b>Info:</b><br>Almost fully instantiated version of a non-trivial model of a yeast cell cycle taken from GinSim. The model contains one large disordered component. The analysis of the model can take non-trivial time due to this large component, but shouldn't consume much memory since the model has almost no parameters.<br><br><b>Model description:</b><br>This model is a direct transcription of the Boolean model published by Irons&nbsp;</span><a href="http://ginsim.org/node/35#ref1" title="Reference 1" style="color: rgb(119, 119, 119); font-family: sans-serif, Arial, Verdana, Helvetica; font-size: 13.28px;">[1]</a><span style="color: rgb(83, 83, 83); font-family: sans-serif, Arial, Verdana, Helvetica; font-size: 13.28px;">, except for the specific temporisation system. Synchronous simulation of this model recovers the results obtained by Irons in absence of time delays (Fig. 3B in&nbsp;</span><a href="http://ginsim.org/node/35#ref1" title="Reference 1" style="color: rgb(119, 119, 119); font-family: sans-serif, Arial, Verdana, Helvetica; font-size: 13.28px;">[1]</a><font color="#535353" face="sans-serif, Arial, Verdana, Helvetica"><span style="font-size: 13.28px;">), i.e. a single, cyclic attractor qualitatively consistent with available kinetic data.</span></font><br><br><b style="color: rgb(83, 83, 83); font-family: sans-serif, Arial, Verdana, Helvetica; font-size: 13.28px;">Citation:<br></b><div style=""><font color="#535353" face="sans-serif, Arial, Verdana, Helvetica"><span style="font-size: 13.28px;">IRONS, D. J. Logical analysis of the budding yeast cell cycle. Journal of theoretical biology, 2009, 257.4: 543-559.</span></font></div><div style="color: rgb(83, 83, 83); font-family: sans-serif, Arial, Verdana, Helvetica; font-size: 13.28px;"><br></div>
		#position:Yhp1:463,95
		$Yhp1:SMBF
		SMBF -> Yhp1
		#position:Cln3:403,58
		$Cln3:!Yhp1
		Yhp1 -| Cln3
		#position:SMBF:342,141
		$SMBF:(((((!Cln3 & !SMBF) & Cln2) & !Clb2) | ((!Cln3 & SMBF) & !Clb2)) | (Cln3 & !Clb2))
		Cln3 -> SMBF
		SMBF -> SMBF
		Cln2 -> SMBF
		Clb2 -| SMBF
		#position:Cln2:143,74
		$Cln2:SMBF
		SMBF -> Cln2
		#position:Clb2:225,269
		$Clb2:((((((((!Clb2 & !Cdc20) & !CKI) & B) | ((((!Clb2 & Cdc20) & !CKI) & !Cdh1) & B)) | ((((Clb2 & !SFF) & !Cdc20) & !CKI) & B)) | (((((Clb2 & !SFF) & Cdc20) & !CKI) & !Cdh1) & B)) | (((Clb2 & SFF) & !Cdc20) & !CKI)) | ((((Clb2 & SFF) & Cdc20) & !CKI) & !Cdh1))
		Clb2 -> Clb2
		SFF -> Clb2
		Cdc20 -| Clb2
		CKI -| Clb2
		Cdh1 -| Clb2
		B -> Clb2
		#position:Clb5:482,179
		$Clb5:(SMBF & !Cdc20)
		SMBF -> Clb5
		Cdc20 -| Clb5
		#position:Cdc20:363,436
		$Cdc20:((Clb2 & SFF) & M)
		Clb2 -> Cdc20
		SFF -> Cdc20
		M -> Cdc20
		#position:SFF:313,314
		$SFF:(((((((!Clb2 & !Cdc20) & !CKI) & B) | ((((!Clb2 & Cdc20) & !CKI) & !Cdh1) & B)) | ((((Clb2 & !SFF) & !Cdc20) & !CKI) & B)) | (((((Clb2 & !SFF) & Cdc20) & !CKI) & !Cdh1) & B)) | (Clb2 & SFF))
		Clb2 -> SFF
		SFF -> SFF
		Cdc20 -| SFF
		CKI -| SFF
		Cdh1 -| SFF
		B -> SFF
		#position:CKI:68,167
		$CKI:((((((((!Cln2 & !Clb5) & !Clb2) & !Swi5) & CKI) | (((!Cln2 & !Clb5) & !Clb2) & Swi5)) | ((((!Cln2 & !Clb5) & Clb2) & Cdc14) & Swi5)) | (((!Cln2 & Clb5) & Cdc14) & Swi5)) | ((Cln2 & Cdc14) & Swi5))
		Cln2 -| CKI
		Clb5 -| CKI
		Clb2 -| CKI
		Cdc14 -> CKI
		Swi5 -> CKI
		CKI -> CKI
		#position:Cdh1:412,235
		$Cdh1:(((((!Cln2 & !Clb5) & !Clb2) | (((!Cln2 & !Clb5) & Clb2) & Cdc14)) | ((!Cln2 & Clb5) & Cdc14)) | (Cln2 & Cdc14))
		Cln2 -| Cdh1
		Clb5 -| Cdh1
		Clb2 -| Cdh1
		Cdc14 -> Cdh1
		#position:B:256,37
		$B:(((((!Cln2 & !Clb5) & B) & !CD) | ((!Cln2 & Clb5) & !CD)) | (Cln2 & !CD))
		Cln2 -> B
		Clb5 -> B
		B -> B
		CD -| B
		#position:M:260,489
		$M:((((!Clb2 & M) & !CD) | (((Clb2 & !S) & M) & !CD)) | ((Clb2 & S) & !CD))
		Clb2 -> M
		S -> M
		M -> M
		CD -| M
		#position:FEAR:195,443
		$FEAR:Cdc20
		Cdc20 -> FEAR
		#position:MEN:120,418
		$MEN:(Clb2 & FEAR)
		Clb2 -> MEN
		FEAR -> MEN
		#position:Cdc14:68,354
		$Cdc14:(FEAR & MEN)
		FEAR -> Cdc14
		MEN -> Cdc14
		#position:Swi5:184,340
		$Swi5:((!Clb2 & SFF) | ((Clb2 & SFF) & Cdc14))
		Clb2 -| Swi5
		SFF -> Swi5
		Cdc14 -> Swi5
		#position:S:554,219
		$S:(((((!Clb5 & !Clb2) & S) & !CD) | ((!Clb5 & Clb2) & !CD)) | (Clb5 & !CD))
		Clb5 -> S
		Clb2 -> S
		S -> S
		CD -| S
		#position:CD:6,240
		$CD:(((FEAR & Cdc14) & M) & !CD)
		FEAR -> CD
		Cdc14 -> CD
		M -> CD
		CD -| CD

	`,

}
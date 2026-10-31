from .agri import R

TIPS = [
    dict(id="drip", icon="droplets", saving="30–50%", title=R("Drip irrigation", "ठिबक सिंचन"),
         body=R("Drip delivers water drop by drop directly to the roots. Compared with flood irrigation it usually saves 30–50% water and reduces weeds. Run it in the early morning and check emitters weekly for blockage.",
                "ठिबक सिंचनात पाणी थेट मुळांजवळ थेंब थेंब दिले जाते. पाट पाण्याच्या तुलनेत साधारण ३०–५०% पाणी वाचते व तण कमी होते. पहाटे चालवा आणि दर आठवड्याला ड्रिपर बंद आहेत का ते तपासा.")),
    dict(id="mulch", icon="leaf", saving="20–40%", title=R("Mulching", "आच्छादन (मल्चिंग)"),
         body=R("Cover the soil with crop residue, straw or plastic mulch. It reduces evaporation, keeps soil cool and controls weeds, so irrigation can be less frequent. Keep a 5–8 cm layer of straw around plants.",
                "जमिनीवर पिकाचे अवशेष, गवत/पेंढा किंवा प्लास्टिक आच्छादन घाला. त्यामुळे बाष्पीभवन कमी होते, माती थंड राहते, तण कमी येते व पाणी कमी वेळा द्यावे लागते. झाडांभोवती ५–८ सेमी पेंढ्याचा थर ठेवा.")),
    dict(id="rain", icon="cloud-rain", saving="Free water", title=R("Rainwater harvesting", "पावसाच्या पाण्याची साठवण"),
         body=R("Collect runoff in a farm pond, percolation tank or recharge pit. Bunds and contour trenches slow the water so it soaks in. Stored water can give 1–2 life-saving irrigations in a dry spell.",
                "शेततळे, पाझर तलाव किंवा पुनर्भरण खड्ड्यात वाहून जाणारे पाणी साठवा. बांध व समपातळी चर पाणी अडवतात व जमिनीत मुरवतात. कोरड्या काळात साठवलेल्या पाण्याने १–२ संरक्षित पाणी देता येतात.")),
    dict(id="timing", icon="sunrise", saving="10–20%", title=R("Irrigate at the right time", "योग्य वेळी सिंचन"),
         body=R("Water early morning or evening to lose less to evaporation, and skip irrigation when rain is forecast. Follow the JalMitra planner instead of a fixed calendar.",
                "पहाटे किंवा संध्याकाळी पाणी द्या म्हणजे बाष्पीभवनाने कमी नुकसान होते. पावसाचा अंदाज असल्यास सिंचन टाळा. ठरावीक दिवसांऐवजी जलमित्र नियोजकाचा सल्ला पाळा.")),
    dict(id="moisture", icon="gauge", saving="10–30%", title=R("Check soil moisture", "जमिनीतील ओलावा तपासा"),
         body=R("Dig 10–15 cm and squeeze a handful of soil: if it crumbles and does not hold shape it is dry. Enter the reading in JalMitra so the plan matches your field.",
                "१०–१५ सेमी खोल खोदून मूठभर माती दाबा: ती भुसभुशीत होऊन आकार धरत नसेल तर कोरडी आहे. ही नोंद जलमित्रमध्ये भरा म्हणजे नियोजन तुमच्या शेताशी जुळेल.")),
    dict(id="crop", icon="sprout", saving="Up to 50%", title=R("Choose low-water crops", "कमी पाण्याची पिके निवडा"),
         body=R("In water-short years grow jowar, bajra, gram or tur instead of sugarcane. Crop Recommendation page ranks crops for your soil, season and stored water.",
                "पाण्याची टंचाई असल्यास ऊसाऐवजी ज्वारी, बाजरी, हरभरा किंवा तूर घ्या. 'पीक सल्ला' पान तुमची जमीन, हंगाम व साठ्यानुसार पिके क्रमवारीने दाखवते.")),
]

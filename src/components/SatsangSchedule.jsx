const SatsangSchedule = () => {
    const content = {
        sumiran: {
            title: 'सामूहिक सुमिरण कार्यक्रम',
            schedules: [
                'प्रतिदिन रात्रि 03:00 बजे से प्रातः 05:30 बजे तक',
                'प्रतिदिन सुबह 07:00 बजे से दिन में 11:00 बजे तक',
                'प्रतिदिन (शनिवार के अतिरिक्त) सायं 06:00 बजे से 08:00 बजे तक',
                'शनिवार सायं 08:00 बजे से 10:00 बजे तक',
                'प्रत्येक माह के द्वितीय शनिवार रात्रि 03:00 बजे से सोमवार दिन में 11:00 बजे तक',
            ],
            webex: {
                label: 'Webex Meeting लिंक',
                url: 'https://kaivalya-gyanvigyanramsabhafoundation-960.my.webex.com/kaivalya-gyanvigyanramsabhafoundation-960.my/j.php?MTID=m2d5026dc3151d0aa994bd08915f8c164'
            },
            whatsapp: {
                label: 'व्हाट्सएप ग्रुप: ll रामसभा भारत ll Ram Sabha Bharat',
                url: 'https://chat.whatsapp.com/JOOLH9G51iR3LcCqSaDFfA',
                note: 'विशेष अवसर पर आयोजित सुमिरण की सूचना व्हाट्सएप ग्रुप पर पोस्ट की जाती है'
            },
            doubtResolution: {
                title: 'शंका समाधान के लिए संचालित ग्रुप्स',
                groups: [
                    {
                        label: 'रामद्वारा (पुणे) महाराष्ट्र',
                        url: 'https://chat.whatsapp.com/KbQRxH571gx23T2S67ALuF'
                    }
                ]
            },
            regionalSatsang: {
                title: 'क्षेत्रीय सत्संग सूचना के ग्रुप्स',
                groups: [
                    {
                        label: 'जोधपुर सत्संग प्रसारण केंद्र',
                        url: 'https://chat.whatsapp.com/LZgIEupk7RHEonCccddzbp'
                    },
                    {
                        label: 'साण्डेराव सत्संग प्रसारण केंद्र',
                        url: 'https://chat.whatsapp.com/KBg9AMSwXFSDENWZULk2s0'
                    }
                ]
            }
        },
        satsang: {
            title: 'सत्संग कार्यक्रम',
            schedules: [
                {
                    time: 'प्रतिदिन प्रातः 05:30 बजे',
                    description: 'पद गायन एवं विवेचन, ज्ञान चर्चा, प्रश्नोत्तरी, सुझाव'
                },
                {
                    time: 'प्रतिदिन सुबह 11:00 बजे',
                    description: 'प्रश्नोत्तरी, सुझाव'
                },
                {
                    time: 'गुरुवार तथा रविवार दिन में 12:00 बजे',
                    description: 'पद गायन, सत्संग, शंका समाधान',
                    youtube: {
                        label: 'Kaivalya-Vigyan Prasaran',
                        url: 'https://www.youtube.com/@Kaivalya-VigyanPrasaran'
                    }
                },
                {
                    time: 'प्रतिदिन (शनिवार के अतिरिक्त) सायं 08:00 बजे',
                    description: 'सत्संग, पद गायन, साखियाँ गायन',
                    youtubeChannels: [
                        { day: 'रविवार, सोमवार, मंगलवार, बुधवार', name: 'AMAR ANAND RAM SABHA JODHPUR', url: 'https://www.youtube.com/@AMARANANDRAMSABHAJODHPUR' },
                        { day: 'गुरुवार तथा शनिवार', name: 'DR. PAVAN CHANDAK', url: 'https://www.youtube.com/@dr.pavanchandak8939' },
                        { day: 'शुक्रवार', name: 'Ramdwara Pune - Shanu Pandit', url: 'https://www.youtube.com/@ramdwarapune-shanupandit9764' }
                    ]
                },
                {
                    time: 'शनिवार सायं 05:45 बजे',
                    description: 'सत्संग, पद गायन, साखियाँ गायन',
                    youtube: {
                        label: 'DR. PAVAN CHANDAK',
                        url: 'https://www.youtube.com/@dr.pavanchandak8939'
                    }
                },
            ]
        }
    };

    return (
        <div className="spiritual-card p-6 mt-8">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                    ऑनलाइन कार्यक्रम
                </h2>
                <p className="text-sm text-muted-foreground">
                    ऑनलाइन सामूहिक सुमिरण एवं सत्संग कार्यक्रमों में सम्मिलित हों
                </p>
            </div>

            <div className="space-y-4">
                {/* Sumiran Section */}
                <div className="border border-border rounded-lg overflow-hidden">
                    <div className="p-4 bg-saffron-50">
                        <div className="flex items-center gap-3">
                            <svg className="w-5 h-5 text-saffron-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <h3 className="text-lg font-semibold">
                                {content.sumiran.title}
                            </h3>
                        </div>
                    </div>

                    <div className="p-4 space-y-3 bg-background">
                        {content.sumiran.schedules.map((schedule, index) => (
                            <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                                <svg className="w-5 h-5 text-saffron-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-sm">{schedule}</p>
                            </div>
                        ))}

                        <div className="pt-4 border-t border-border space-y-3">
                            <a
                                href={content.sumiran.webex.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors group"
                            >
                                <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                <span className="text-sm font-medium text-blue-700 group-hover:underline">
                                    {content.sumiran.webex.label}
                                </span>
                            </a>

                            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 space-y-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                    <span className="text-sm font-semibold text-blue-800">📱 कीपैड मोबाइल से सुनने हेतु:</span>
                                </div>

                                <p className="text-xs text-gray-600 italic">
                                    (40 सेकंड में सत्संग में सम्मिलित हो जाएँगे)
                                </p>

                                <div className="space-y-2">
                                    <p className="text-xs font-medium text-gray-700">नीचे दिए गए किसी भी एक नंबर पर डायल करें:</p>

                                    <a
                                        href="tel:+911164800114,,26441014121#,#,#"
                                        className="block bg-white p-2 rounded border border-blue-300 hover:bg-blue-50 transition-colors"
                                    >
                                        <code className="text-xs text-blue-900 font-mono break-all">+911164800114,,26441014121#,#,#</code>
                                    </a>

                                    <p className="text-xs text-center text-gray-600 font-medium">या</p>

                                    <a
                                        href="tel:+911164800114,,*26441014121#,,,#"
                                        className="block bg-white p-2 rounded border border-blue-300 hover:bg-blue-50 transition-colors"
                                    >
                                        <code className="text-xs text-blue-900 font-mono break-all">+911164800114,,*26441014121#,,,#</code>
                                    </a>
                                </div>

                                <div className="pt-2 border-t border-blue-300 space-y-2">
                                    <p className="text-xs font-semibold text-gray-700">जरूरी कीपैड कमांड्स:</p>
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className="text-lg">✋</span>
                                            <code className="bg-white px-2 py-0.5 rounded text-blue-900 font-mono">*3</code>
                                            <span className="text-gray-700">- हाथ उठाने या नीचे करने के लिए</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className="text-lg">🎤</span>
                                            <code className="bg-white px-2 py-0.5 rounded text-blue-900 font-mono">*6</code>
                                            <span className="text-gray-700">- म्यूट या अनम्यूट करने के लिए</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                                <p className="text-xs text-gray-600 mb-2">
                                    {content.sumiran.whatsapp.note}
                                </p>
                                <a
                                    href={content.sumiran.whatsapp.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-sm font-medium text-green-700 hover:underline"
                                >
                                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    <span>{content.sumiran.whatsapp.label}</span>
                                    <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </a>
                            </div>

                            {/* Doubt Resolution Groups */}
                            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                                <p className="text-xs font-semibold text-amber-800 mb-2">
                                    {content.sumiran.doubtResolution.title}
                                </p>
                                <div className="space-y-2">
                                    {content.sumiran.doubtResolution.groups.map((group, idx) => (
                                        <a
                                            key={idx}
                                            href={group.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 text-sm font-medium text-amber-700 hover:underline"
                                        >
                                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                            <span>{group.label}</span>
                                            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                        </a>
                                    ))}
                                </div>
                            </div>

                            {/* Regional Satsang Groups */}
                            <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
                                <p className="text-xs font-semibold text-purple-800 mb-2">
                                    {content.sumiran.regionalSatsang.title}
                                </p>
                                <div className="space-y-2">
                                    {content.sumiran.regionalSatsang.groups.map((group, idx) => (
                                        <a
                                            key={idx}
                                            href={group.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 text-sm font-medium text-purple-700 hover:underline"
                                        >
                                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                            <span>{group.label}</span>
                                            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Satsang Section */}
                <div className="border border-border rounded-lg overflow-hidden">
                    <div className="p-4 bg-blue-50">
                        <div className="flex items-center gap-3">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <h3 className="text-lg font-semibold">
                                {content.satsang.title}
                            </h3>
                        </div>
                    </div>

                    <div className="p-4 space-y-4 bg-background">
                        {content.satsang.schedules.map((schedule, index) => (
                            <div key={index} className="p-3 rounded-lg bg-gray-50 space-y-2">
                                <div className="flex items-start gap-3">
                                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div className="flex-1 space-y-2">
                                        <p className="text-sm font-medium">{schedule.time}</p>
                                        {schedule.description && (
                                            <p className="text-xs text-gray-600">{schedule.description}</p>
                                        )}

                                        {schedule.youtube && (
                                            <a
                                                href={schedule.youtube.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 text-xs font-medium text-red-600 hover:underline"
                                            >
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                </svg>
                                                <span>{schedule.youtube.label}</span>
                                            </a>
                                        )}

                                        {schedule.youtubeChannels && (
                                            <div className="space-y-1.5 mt-2">
                                                {schedule.youtubeChannels.map((channel, idx) => (
                                                    <div key={idx} className="flex items-start gap-2 text-xs">
                                                        <span className="text-gray-600 min-w-0 flex-shrink">{channel.day}:</span>
                                                        <a
                                                            href={channel.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 text-red-600 hover:underline flex-1 min-w-0"
                                                        >
                                                            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                            </svg>
                                                            <span className="">{channel.name}</span>
                                                        </a>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SatsangSchedule;

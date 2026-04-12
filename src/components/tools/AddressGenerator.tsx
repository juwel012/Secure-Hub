import React, { useState } from 'react';
import { MapPin, Copy, RefreshCw, Check, Globe, LayoutGrid, User, Phone, Navigation, Shield, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { faker, allLocales, Faker } from '@faker-js/faker';

interface GeneratedAddress {
  name: string;
  gender: 'Male' | 'Female';
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
  ssn: string;
  birthday: string;
  age: number;
  occupation: string;
  company: string;
  email: string;
  username: string;
  bloodType: string;
  weight: string;
  height: string;
  googleMapsUrl: string;
}

const locales = [
  { code: 'en_US', name: 'USA', flag: '🇺🇸' },
  { code: 'en_GB', name: 'UK', flag: '🇬🇧' },
  { code: 'de', name: 'Germany', flag: '🇩🇪' },
  { code: 'it', name: 'Italy', flag: '🇮🇹' },
  { code: 'fr', name: 'France', flag: '🇫🇷' },
  { code: 'es', name: 'Spain', flag: '🇪🇸' },
  { code: 'ja', name: 'Japan', flag: '🇯🇵' },
  { code: 'ko', name: 'Korea', flag: '🇰🇷' },
  { code: 'zh_CN', name: 'China', flag: '🇨🇳' },
  { code: 'pt_BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'ru', name: 'Russia', flag: '🇷🇺' },
  { code: 'ar', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'nl', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'tr', name: 'Turkey', flag: '🇹🇷' },
  { code: 'pl', name: 'Poland', flag: '🇵🇱' },
  { code: 'sv', name: 'Sweden', flag: '🇸🇪' },
  { code: 'da', name: 'Denmark', flag: '🇩🇰' },
  { code: 'fi', name: 'Finland', flag: '🇫🇮' },
  { code: 'no', name: 'Norway', flag: '🇳🇴' },
  { code: 'pt', name: 'Portugal', flag: '🇵🇹' },
  { code: 'el', name: 'Greece', flag: '🇬🇷' },
  { code: 'hi', name: 'India', flag: '🇮🇳' },
  { code: 'id', name: 'Indonesia', flag: '🇮🇩' },
  { code: 'vi', name: 'Vietnam', flag: '🇻🇳' },
];

interface AddressGeneratorProps {
  state: {
    results: GeneratedAddress[];
    selectedLocale: string;
    quantity: number;
    gender: 'Random' | 'Male' | 'Female';
  };
  setState: React.Dispatch<React.SetStateAction<{
    results: GeneratedAddress[];
    selectedLocale: string;
    quantity: number;
    gender: 'Random' | 'Male' | 'Female';
  }>>;
}

const REAL_WORLD_DATA: Record<string, { cities: string[], streets: string[], states?: string[], zipPrefixes?: string[] }> = {
  'en_US': {
    cities: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'],
    streets: ['Broadway', 'Fifth Avenue', 'Michigan Avenue', 'Ocean Drive', 'Main Street', 'Oak Street', 'Washington Street', 'Lake Shore Drive', 'Santa Monica Boulevard', 'Wilshire Boulevard'],
    states: ['NY', 'CA', 'IL', 'TX', 'AZ', 'PA', 'TX', 'CA', 'TX', 'CA'],
    zipPrefixes: ['100', '900', '606', '770', '850', '191', '782', '921', '752', '951']
  },
  'en_GB': {
    cities: ['London', 'Birmingham', 'Manchester', 'Glasgow', 'Liverpool', 'Bristol', 'Edinburgh', 'Leeds'],
    streets: ['Oxford Street', 'Regent Street', 'Piccadilly', 'Abbey Road', 'Baker Street', 'Downing Street', 'Kings Road', 'Fleet Street'],
    zipPrefixes: ['W1', 'B1', 'M1', 'G1', 'L1', 'BS1', 'EH1', 'LS1']
  },
  'de': {
    cities: ['Berlin', 'Hamburg', 'Munich', 'Cologne', 'Frankfurt', 'Stuttgart', 'Düsseldorf', 'Dortmund'],
    streets: ['Friedrichstraße', 'Kurfürstendamm', 'Leopoldstraße', 'Königsallee', 'Zeil', 'Reeperbahn', 'Unter den Linden', 'Maximilianstraße'],
    zipPrefixes: ['10', '20', '80', '50', '60', '70', '40', '44']
  }
};

export const AddressGenerator: React.FC<AddressGeneratorProps> = ({ state, setState }) => {
  const { results, selectedLocale, quantity, gender } = state;
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const generateAddresses = async () => {
    setGenerating(true);
    await new Promise(r => setTimeout(r, 800));

    const localeMap: Record<string, string> = {
      'en_US': 'en_US',
      'en_GB': 'en_GB',
      'de': 'de',
      'it': 'it',
      'fr': 'fr',
      'es': 'es',
      'ja': 'ja',
      'ko': 'ko',
      'zh_CN': 'zh_CN',
      'pt_BR': 'pt_BR',
      'ru': 'ru',
      'ar': 'ar',
      'nl': 'nl',
      'tr': 'tr',
      'pl': 'pl',
      'sv': 'sv',
      'da': 'da',
      'fi': 'fi',
      'no': 'no',
      'pt': 'pt_PT',
      'el': 'el',
      'hi': 'hi',
      'id': 'id_ID',
      'vi': 'vi'
    };

    const fakerKey = localeMap[selectedLocale] || 'en';
    const localeData = allLocales[fakerKey as keyof typeof allLocales] || allLocales.en;
    const customFaker = new Faker({ locale: [localeData, allLocales.en] });

    const generated: GeneratedAddress[] = [];
    const realData = REAL_WORLD_DATA[selectedLocale];

    for (let i = 0; i < quantity; i++) {
      const selectedGender = gender === 'Random' ? (Math.random() > 0.5 ? 'male' : 'female') : gender.toLowerCase() as 'male' | 'female';
      const birthday = customFaker.date.birthdate({ min: 18, max: 80, mode: 'age' });
      const firstName = customFaker.person.firstName(selectedGender);
      const lastName = customFaker.person.lastName(selectedGender);
      const fullName = `${firstName} ${lastName}`;
      
      let city = customFaker.location.city();
      let street = customFaker.location.streetAddress({ useFullAddress: true });
      let stateName = customFaker.location.state();
      let zipCode = customFaker.location.zipCode();
      
      if (realData) {
        const dataIndex = customFaker.number.int({ min: 0, max: realData.cities.length - 1 });
        city = realData.cities[dataIndex];
        const streetName = customFaker.helpers.arrayElement(realData.streets);
        const houseNum = customFaker.number.int({ min: 1, max: 250 });
        
        if (selectedLocale === 'de' || selectedLocale === 'fr' || selectedLocale === 'es' || selectedLocale === 'it') {
          street = `${streetName} ${houseNum}`;
        } else if (selectedLocale === 'ja') {
          street = `${city} ${customFaker.number.int({ min: 1, max: 9 })}-${customFaker.number.int({ min: 1, max: 20 })}-${customFaker.number.int({ min: 1, max: 30 })}`;
        } else {
          street = `${houseNum} ${streetName}`;
        }

        if (realData.states) {
          stateName = realData.states[dataIndex];
        }

        if (realData.zipPrefixes) {
          zipCode = realData.zipPrefixes[dataIndex] + customFaker.string.numeric(selectedLocale === 'en_US' ? 2 : 3);
        }
      }

      const countryName = locales.find(l => l.code === selectedLocale)?.name || 'USA';
      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${street}, ${city}, ${stateName} ${zipCode}, ${countryName}`)}`;

      generated.push({
        name: fullName,
        gender: selectedGender === 'male' ? 'Male' : 'Female',
        street: street,
        city: city,
        state: stateName,
        zip: zipCode,
        country: countryName,
        phone: customFaker.phone.number(),
        ssn: customFaker.string.numeric('###-##-####'),
        birthday: birthday.toLocaleDateString(),
        age: new Date().getFullYear() - birthday.getFullYear(),
        occupation: customFaker.person.jobTitle(),
        company: customFaker.company.name(),
        email: customFaker.internet.email({ firstName, lastName }),
        username: customFaker.internet.username({ firstName, lastName }),
        bloodType: customFaker.helpers.arrayElement(['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']),
        weight: `${customFaker.number.int({ min: 50, max: 120 })} kg`,
        height: `${customFaker.number.int({ min: 150, max: 200 })} cm`,
        googleMapsUrl: googleMapsUrl
      });
    }
    setState(prev => ({ ...prev, results: generated }));
    setGenerating(false);
  };

  const setQuantity = (q: number) => setState(prev => ({ ...prev, quantity: q }));
  const setSelectedLocale = (l: string) => setState(prev => ({ ...prev, selectedLocale: l }));
  const setGender = (g: 'Random' | 'Male' | 'Female') => setState(prev => ({ ...prev, gender: g }));

  const copyAddress = (addr: GeneratedAddress, index: number) => {
    const text = `
Full Name: ${addr.name}
Address: ${addr.street}, ${addr.city}, ${addr.state} ${addr.zip}, ${addr.country}
Phone: ${addr.phone}
SSN: ${addr.ssn}
Birthday: ${addr.birthday} (Age: ${addr.age})
Occupation: ${addr.occupation} at ${addr.company}
Email: ${addr.email}
Username: ${addr.username}
Blood Type: ${addr.bloodType}
Weight/Height: ${addr.weight} / ${addr.height}
    `.trim();
    copyToClipboard(text, `full-${index}`);
  };

  const CopyField = ({ label, value, id }: { label: string, value: string, id: string }) => (
    <div 
      onClick={() => copyToClipboard(value, id)}
      className="group/field relative bg-white/5 p-4 rounded-2xl border border-white/5 hover:border-cyber-purple/30 cursor-pointer transition-all active:scale-[0.98]"
    >
      <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1 group-hover/field:text-cyber-purple transition-colors">{label}</p>
      <p className="text-[11px] font-bold text-slate-300 group-hover/field:text-white transition-colors truncate">{value}</p>
      <div className="absolute top-2 right-2 opacity-0 group-hover/field:opacity-100 transition-opacity">
        {copiedIndex === id ? <Check className="w-3 h-3 text-cyber-purple" /> : <Copy className="w-3 h-3 text-slate-600" />}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        <div className="lg:col-span-4">
          <div className="p-6 sm:p-8 glass rounded-[1.5rem] sm:rounded-[2.5rem] border border-white/5 relative overflow-hidden h-full flex flex-col justify-center">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyber-purple/5 rounded-full blur-[40px] -mr-16 -mt-16" />
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-cyber-purple/10 rounded-xl sm:rounded-2xl flex items-center justify-center border border-cyber-purple/20 shadow-[0_0_20px_rgba(188,19,254,0.1)]">
                  <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-cyber-purple" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Virtual <span className="text-cyber-purple">Identity</span></h2>
                  <p className="text-[10px] font-black text-cyber-purple/60 uppercase tracking-[0.3em]">Identity Generator v4.0</p>
                </div>
              </div>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                Generate high-integrity virtual identities and addresses for testing and privacy across global communication networks.
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="p-6 sm:p-8 glass rounded-[1.5rem] sm:rounded-[2.5rem] border border-white/5 h-full flex flex-col justify-center space-y-6 sm:space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Target Region</label>
                <div className="relative group">
                  <Globe className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-cyber-purple/40 group-focus-within:text-cyber-purple transition-colors" />
                  <select 
                    className="w-full pl-14 pr-10 py-4 sm:py-5 bg-dark-800 border border-white/5 rounded-xl sm:rounded-2xl text-sm font-bold text-white appearance-none cursor-pointer focus:border-cyber-purple outline-none transition-all"
                    value={selectedLocale}
                    onChange={(e) => setSelectedLocale(e.target.value)}
                  >
                    {locales.map(l => (
                      <option key={l.code} value={l.code} className="bg-dark-900 text-white">{l.flag} {l.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Gender</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Random', 'Male', 'Female'].map((g) => (
                    <button
                      key={g}
                      onClick={() => setGender(g as any)}
                      className={`py-3 sm:py-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                        gender === g 
                          ? 'bg-cyber-purple text-white border-cyber-purple shadow-lg shadow-cyber-purple/20' 
                          : 'bg-white/5 text-slate-500 border-white/5 hover:border-cyber-purple/30'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Interface Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 sm:p-8 glass rounded-[1.5rem] sm:rounded-[2.5rem] border border-white/5 space-y-6 sm:space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Batch Size</label>
                <span className="text-xs font-black text-cyber-purple">{quantity} PROFILES</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="20" 
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                className="w-full accent-cyber-purple h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer"
              />
            </div>

            <button
              onClick={generateAddresses}
              disabled={generating}
              className="w-full py-4 sm:py-5 bg-cyber-purple hover:bg-cyber-purple/90 text-white rounded-xl sm:rounded-2xl font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-4 transition-all shadow-lg shadow-cyber-purple/20 active:scale-[0.98] disabled:opacity-50"
            >
              {generating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              {generating ? 'Generating Profiles...' : 'Generate Identities'}
            </button>
          </div>

          <div className="p-6 sm:p-8 glass rounded-[1.5rem] sm:rounded-[2.5rem] border border-white/5 space-y-4 sm:space-y-6">
            <div className="flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <Shield className="w-4 h-4" /> Privacy Policy
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              All identity data is generated locally using high-entropy seeds to ensure privacy and zero traceability.
            </p>
          </div>
        </div>

        <div className="lg:col-span-8 flex flex-col">
          <div className="flex items-center justify-between mb-6 px-4">
            <div className="flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <LayoutGrid className="w-4 h-4" /> Identity Profiles
            </div>
          </div>
          
          <div className="flex-1 space-y-6 max-h-[400px] lg:max-h-[800px] overflow-y-auto pr-2 sm:pr-4 custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {results.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-800 py-20 sm:py-40 glass border border-white/5 rounded-[1.5rem] sm:rounded-[3rem]">
                  <Navigation className="w-16 h-16 sm:w-20 sm:h-20 mb-6 opacity-5" />
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-30">Awaiting Initialization</p>
                </div>
              ) : (
                results.map((addr, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="group glass border border-white/5 hover:border-cyber-purple/40 p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] transition-all shadow-sm hover:shadow-[0_0_40px_rgba(188,19,254,0.1)] relative overflow-hidden"
                  >
                    {/* Hover Glow */}
                    <div className="absolute inset-0 bg-cyber-purple/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyber-purple/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-cyber-purple/15 transition-colors" />
                    
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8 relative z-10">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-dark-900 rounded-xl sm:rounded-2xl flex items-center justify-center text-slate-500 group-hover:text-cyber-purple transition-colors border border-white/5 group-hover:border-cyber-purple/30 shadow-inner">
                          <User className="w-6 h-6 sm:w-7 sm:h-7" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-0.5 group-hover:text-cyber-purple/60 transition-colors">Profile #{i + 1}</p>
                          <p className="text-lg sm:text-xl font-black text-white flex items-center gap-3 group-hover:text-cyber-purple transition-colors">
                            {addr.name}
                            <span className={`text-[10px] px-2 py-0.5 rounded-md ${addr.gender === 'Male' ? 'bg-blue-500/20 text-blue-400' : 'bg-pink-500/20 text-pink-400'}`}>
                              {addr.gender}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button 
                          onClick={() => copyAddress(addr, i)}
                          className="flex-1 sm:flex-none px-4 sm:px-6 py-3 bg-dark-950 hover:bg-cyber-purple/20 text-slate-500 hover:text-cyber-purple rounded-xl transition-all border border-white/5 hover:border-cyber-purple/30 text-[10px] font-black uppercase tracking-widest"
                        >
                          Copy Profile
                        </button>
                        <a 
                          href={addr.googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 bg-dark-950 hover:bg-cyber-blue/20 text-slate-500 hover:text-cyber-blue rounded-xl transition-all border border-white/5 hover:border-cyber-blue/30"
                        >
                          <MapPin className="w-5 h-5" />
                        </a>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
                      <div className="space-y-4">
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Address Details</p>
                        <div className="grid grid-cols-1 gap-4">
                          <CopyField label="Street" value={addr.street} id={`street-${i}`} />
                          <div className="grid grid-cols-2 gap-4">
                            <CopyField label="City" value={addr.city} id={`city-${i}`} />
                            <CopyField label="State" value={addr.state} id={`state-${i}`} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <CopyField label="Zip" value={addr.zip} id={`zip-${i}`} />
                            <CopyField label="Country" value={addr.country} id={`country-${i}`} />
                          </div>
                          <CopyField label="Phone Number" value={addr.phone} id={`phone-${i}`} />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Personal Information</p>
                        <div className="grid grid-cols-1 gap-4">
                          <CopyField label="SSN" value={addr.ssn} id={`ssn-${i}`} />
                          <div className="grid grid-cols-2 gap-4">
                            <CopyField label="Occupation" value={addr.occupation} id={`occ-${i}`} />
                            <CopyField label="Company" value={addr.company} id={`comp-${i}`} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <CopyField label="Birthday" value={addr.birthday} id={`birth-${i}`} />
                            <CopyField label="Blood" value={addr.bloodType} id={`blood-${i}`} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <CopyField label="Username" value={addr.username} id={`user-${i}`} />
                            <CopyField label="Email" value={addr.email} id={`email-${i}`} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-white/5 flex flex-wrap gap-3 sm:gap-4 relative z-10">
                      <div className="bg-dark-950/30 px-3 sm:px-4 py-2 rounded-xl border border-white/5 flex items-center gap-2 sm:gap-3">
                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Age</p>
                        <p className="text-[10px] font-bold text-cyber-purple">{addr.age}</p>
                      </div>
                      <div className="bg-dark-950/30 px-3 sm:px-4 py-2 rounded-xl border border-white/5 flex items-center gap-2 sm:gap-3">
                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Weight</p>
                        <p className="text-[10px] font-bold text-slate-400">{addr.weight}</p>
                      </div>
                      <div className="bg-dark-950/30 px-3 sm:px-4 py-2 rounded-xl border border-white/5 flex items-center gap-2 sm:gap-3">
                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Height</p>
                        <p className="text-[10px] font-bold text-slate-400">{addr.height}</p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

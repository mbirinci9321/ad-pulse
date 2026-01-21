import { XMarkIcon } from '@heroicons/react/24/outline';

interface LicenseModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function LicenseModal({ isOpen, onClose }: LicenseModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[100]">
            <div className="relative top-10 mx-auto p-8 border w-3/4 max-w-3xl shadow-2xl rounded-xl bg-white">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h2 className="text-2xl font-bold text-gray-900 font-serif">AD Pulse Yazılım Lisans Sözleşmesi</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="prose prose-sm max-h-[70vh] overflow-y-auto pr-4 text-gray-700 space-y-4 text-justify">
                    <p className="font-semibold text-sm">Son Güncelleme: 18 Ocak 2026</p>

                    <p>
                        Bu yazılım lisans sözleşmesi ("Sözleşme"), <strong>Murat Birinci Tech Labs</strong> ("Yayımcı") ile bu yazılımı yükleyen ve/veya kullanan kişi veya kuruluş ("Kullanıcı") arasında akdedilmiştir.
                    </p>

                    <section>
                        <h3 className="text-base font-bold text-gray-800 uppercase tracking-tight">1. LİSANS VERİLMESİ</h3>
                        <p>
                            Yayımcı, Kullanıcı'ya AD Pulse yazılımını ("Yazılım") yalnızca dahili iş amaçları için kullanmak üzere münhasır olmayan, devredilemez bir lisans vermektedir.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-base font-bold text-gray-800 uppercase tracking-tight">2. KULLANIM KISITLAMALARI</h3>
                        <p className="list-disc pl-4">
                            Kullanıcı aşağıdakileri yapmamayı kabul eder:
                            <br />• Yazılımı tersine mühendislik, kaynak koda dönüştürme veya parçalarına ayırma
                            <br />• Yazılımı üçüncü taraflara satma, kiralama veya alt lisanslama
                            <br />• Yazılımın telif hakkı bildirimlerini kaldırma veya değiştirme
                            <br />• Yazılımı yasa dışı amaçlarla kullanma
                        </p>
                    </section>

                    <section>
                        <h3 className="text-base font-bold text-gray-800 uppercase tracking-tight">3. FİKRİ MÜLKİYET</h3>
                        <p>
                            Yazılım ve tüm kopyaları Yayımcı'nın mülkiyetindedir. Bu Sözleşme, Yazılım üzerinde herhangi bir mülkiyet hakkı vermez.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-base font-bold text-gray-800 uppercase tracking-tight">4. GARANTİ REDDİ</h3>
                        <p className="font-medium">
                            YAZILIM "OLDUĞU GİBİ" SUNULMAKTADIR. YAYIMCI, TİCARİ ELVERİŞLİLİK, BELİRLİ BİR AMACA UYGUNLUK VEYA İHLAL ETMEME DAHİL ANCAK BUNLARLA SINIRLI OLMAKSIZIN, AÇIK VEYA ZIMNİ HİÇBİR GARANTİ VERMEZ.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-base font-bold text-gray-800 uppercase tracking-tight">5. SORUMLULUK SINIRLAMASI</h3>
                        <p>
                            Yayımcı, bu Yazılımın kullanımından kaynaklanan doğrudan, dolaylı, arızi, özel veya sonuç olarak ortaya çıkan zararlardan hiçbir koşulda sorumlu tutulamaz.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-base font-bold text-gray-800 uppercase tracking-tight">6. DESTEK VE GÜNCELLEMELER</h3>
                        <p>
                            Yayımcı, kendi takdirine bağlı olarak Yazılım için teknik destek ve güncellemeler sağlayabilir. Ancak bu hizmetlerin sağlanması zorunlu değildir.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-base font-bold text-gray-800 uppercase tracking-tight">7. SÜRE VE FESİH</h3>
                        <p>
                            Bu Sözleşme, Kullanıcı Yazılımı yüklediğinde yürürlüğe girer. Kullanıcı Sözleşme şartlarını ihlal ederse, Yayımcı bu lisansı derhal feshedebilir.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-base font-bold text-gray-800 uppercase tracking-tight">8. UYGULANACAK HUKUK</h3>
                        <p>
                            Bu Sözleşme, Türkiye Cumhuriyeti kanunlarına tabidir.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-base font-bold text-gray-800 uppercase tracking-tight">9. KABUL</h3>
                        <p>
                            Bu Yazılımı yükleyerek veya kullanarak, bu Sözleşmenin tüm hüküm ve koşullarını okuduğunuzu, anladığınızı ve bunlara bağlı olmayı kabul ettiğinizi beyan edersiniz.
                        </p>
                    </section>

                    <div className="border-t pt-4 mt-6">
                        <p className="text-gray-500 text-xs text-center">
                            © 2026 Murat Birinci Tech Labs. Tüm hakları saklıdır.
                        </p>
                    </div>
                </div>

                <div className="mt-8 flex justify-center">
                    <button
                        onClick={onClose}
                        className="px-12 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                        Sözleşmeyi Okudum ve Kabul Ediyorum
                    </button>
                </div>
            </div>
        </div>
    );
}

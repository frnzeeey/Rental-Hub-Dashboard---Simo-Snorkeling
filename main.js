        // 1. GEAR PRICING & COMMISSION RULES (in PHP)
        const GEAR_PRICING_RULES = {
            "Mask": { price: 100, ourShare: 50 },
            "Short Fins": { price: 150, ourShare: 50 },
            "Long Fins": { price: 300, ourShare: 150 },
            "Lifevest": { price: 100, ourShare: 50 },
            "GoPro": { price: 700, ourShare: 400 },
            "Floater": { price: 100, ourShare: 50 }
        };

        // Default Registered Lessors
        const defaultLessorsDirectory = [
            { id: 1, name: "Island Water Sports", type: "Partner Business", location: "Station 1", phone: "0917-123-4567", commission: "Standard Split" },
            { id: 2, name: "Dive Pro Moalboal", type: "Partner Business", location: "Panagsama Beach", phone: "0918-987-6543", commission: "Standard Split" }
        ];

        // Stock Overview Catalog
        const gearStockDirectory = [
            { code: "Mask", name: "Snorkel Mask", icon: "glasses", totalStock: 50 },
            { code: "Short Fins", name: "Short Fins", icon: "footprints", totalStock: 40 },
            { code: "Long Fins", name: "Long Fins", icon: "waves", totalStock: 30 },
            { code: "Lifevest", name: "Lifevest", icon: "life-buoy", totalStock: 60 },
            { code: "GoPro", name: "GoPro Camera", icon: "camera", totalStock: 10 },
            { code: "Floater", name: "Floater", icon: "circle-dot", totalStock: 25 }
        ];

        // Application Global State Arrays
        let rentalsData = [];
        let lessorsDirectory = [];
        let currentAddGearRentalId = null;

        // UNIVERSAL ICON REFRESH HELPER
        function refreshIcons() {
            if (window.lucide && typeof window.lucide.createIcons === 'function') {
                window.lucide.createIcons();
            }
        }

        // UI Toast Notification helper
        function showToast(message, type = 'info') {
            const container = document.getElementById('toastContainer');
            if (!container) return;

            const toast = document.createElement('div');
            let iconName = 'info';
            let bgClass = 'bg-slate-900 border-slate-700 text-white';

            if (type === 'success') {
                iconName = 'check-circle-2';
                bgClass = 'bg-teal-900/90 border-teal-700 text-teal-100';
            } else if (type === 'warning') {
                iconName = 'alert-triangle';
                bgClass = 'bg-amber-900/90 border-amber-700 text-amber-100';
            }

            toast.className = `p-3.5 rounded-xl border shadow-xl flex items-center space-x-3 text-xs font-medium toast-animate pointer-events-auto ${bgClass}`;
            toast.innerHTML = `
                <i data-lucide="${iconName}" class="w-4 h-4 flex-shrink-0"></i>
                <span class="flex-1">${message}</span>
            `;
            container.appendChild(toast);
            refreshIcons();

            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transition = 'opacity 0.3s ease';
                setTimeout(() => toast.remove(), 300);
            }, 3500);
        }

        // Modal Open / Close Functions
        function openRentalModal() {
            resetRentalFormQuantities();
            toggleLessorFields();
            const modal = document.getElementById('rentalModal');
            if (modal) modal.classList.remove('hidden');
            refreshIcons();
        }

        function closeRentalModal() {
            const modal = document.getElementById('rentalModal');
            if (modal) modal.classList.add('hidden');
        }

        function openAddGearModal(rentalId) {
            currentAddGearRentalId = rentalId;
            const rental = rentalsData.find(r => r.id === rentalId);
            if (!rental) return;

            const subtitle = document.getElementById('addGearCustomerSubtitle');
            if (subtitle) subtitle.textContent = `Append items for ${rental.customerName}`;

            Object.keys(GEAR_PRICING_RULES).forEach(name => {
                const chk = document.getElementById(`addChk-${name}`);
                const qty = document.getElementById(`addQty-${name}`);
                if (chk) chk.checked = false;
                if (qty) qty.value = 0;
            });

            const currDisplay = document.getElementById('currentRentedItemsDisplay');
            if (currDisplay) {
                const itemsList = Object.entries(rental.items || {})
                    .filter(([_, q]) => q > 0)
                    .map(([n, q]) => `${n} x${q}`)
                    .join(', ');
                currDisplay.textContent = itemsList || 'None';
            }

            calculateAddGearModalPreview();
            const modal = document.getElementById('addGearModal');
            if (modal) modal.classList.remove('hidden');
            refreshIcons();
        }

        function closeAddGearModal() {
            currentAddGearRentalId = null;
            const modal = document.getElementById('addGearModal');
            if (modal) modal.classList.add('hidden');
        }

        function openLessorModal() {
            const modal = document.getElementById('addLessorModal');
            if (modal) modal.classList.remove('hidden');
            refreshIcons();
        }

        function closeLessorModal() {
            const modal = document.getElementById('addLessorModal');
            if (modal) modal.classList.add('hidden');
        }

        function openEditLessorModal(id) {
            const lessor = lessorsDirectory.find(l => l.id === id);
            if (!lessor) return;

            document.getElementById('editLessorId').value = lessor.id;
            document.getElementById('editLessorName').value = lessor.name || '';
            document.getElementById('editLessorType').value = lessor.type || 'Partner Business';
            document.getElementById('editLessorLocation').value = lessor.location || '';
            document.getElementById('editLessorPhone').value = lessor.phone || '';
            document.getElementById('editLessorCommission').value = lessor.commission || '';

            const modal = document.getElementById('editLessorModal');
            if (modal) modal.classList.remove('hidden');
            refreshIcons();
        }

        function closeEditLessorModal() {
            const modal = document.getElementById('editLessorModal');
            if (modal) modal.classList.add('hidden');
        }

        function toggleTheme() {
            const html = document.documentElement;
            const isDark = html.classList.contains('dark');
            if (isDark) {
                html.classList.remove('dark');
                localStorage.setItem('aquatrack_theme', 'light');
            } else {
                html.classList.add('dark');
                localStorage.setItem('aquatrack_theme', 'dark');
            }
            updateThemeIcons();
        }

        function updateThemeIcons() {
            const isDark = document.documentElement.classList.contains('dark');
            const sunIcon = document.getElementById('themeIconSun');
            const moonIcon = document.getElementById('themeIconMoon');
            if (sunIcon && moonIcon) {
                if (isDark) {
                    sunIcon.classList.remove('hidden');
                    moonIcon.classList.add('hidden');
                } else {
                    sunIcon.classList.add('hidden');
                    moonIcon.classList.remove('hidden');
                }
            }
            refreshIcons();
        }

        function switchTab(tabName) {
            ['dashboard', 'inventory', 'lessors'].forEach(t => {
                const view = document.getElementById(`view-${t}`);
                const nav = document.getElementById(`nav-${t}`);
                const dock = document.getElementById(`dock-${t}`);

                if (view) view.classList.add('hidden');
                if (nav) {
                    nav.classList.remove('bg-teal-500/10', 'text-teal-600', 'dark:text-teal-400', 'font-semibold', 'border', 'border-teal-500/20');
                    nav.classList.add('hover:bg-slate-100', 'dark:hover:bg-slate-800', 'text-slate-600', 'dark:text-slate-400');
                }
                if (dock) {
                    dock.classList.remove('bg-teal-500/10', 'text-teal-600', 'dark:text-teal-400', 'font-bold');
                    dock.classList.add('text-slate-500', 'dark:text-slate-400');
                }
            });

            const activeView = document.getElementById(`view-${tabName}`);
            const activeNav = document.getElementById(`nav-${tabName}`);
            const activeDock = document.getElementById(`dock-${tabName}`);
            const pageTitle = document.getElementById('pageTitle');

            if (activeView) activeView.classList.remove('hidden');
            if (activeNav) {
                activeNav.classList.add('bg-teal-500/10', 'text-teal-600', 'dark:text-teal-400', 'font-semibold', 'border', 'border-teal-500/20');
                activeNav.classList.remove('hover:bg-slate-100', 'dark:hover:bg-slate-800', 'text-slate-600', 'dark:text-slate-400');
            }
            if (activeDock) {
                activeDock.classList.add('bg-teal-500/10', 'text-teal-600', 'dark:text-teal-400', 'font-bold');
                activeDock.classList.remove('text-slate-500', 'dark:text-slate-400');
            }

            if (pageTitle) {
                if (tabName === 'dashboard') pageTitle.textContent = "Rental Dashboard";
                else if (tabName === 'inventory') pageTitle.textContent = "Gear Inventory Stock";
                else if (tabName === 'lessors') pageTitle.textContent = "Lessors Directory";
            }

            if (tabName === 'inventory') renderInventoryGrid();
            if (tabName === 'lessors') renderLessorsGrid();

            refreshIcons();
        }

        function saveState() {
            try {
                localStorage.setItem('aquatrack_rentals', JSON.stringify(rentalsData));
                localStorage.setItem('aquatrack_lessors', JSON.stringify(lessorsDirectory));
            } catch (e) {
                console.warn("Unable to save to localStorage:", e);
            }
        }

        function loadSavedState() {
            try {
                const savedTheme = localStorage.getItem('aquatrack_theme') || 'dark';
                if (savedTheme === 'dark') {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
                updateThemeIcons();

                const savedRentals = localStorage.getItem('aquatrack_rentals');
                const savedLessors = localStorage.getItem('aquatrack_lessors');

                if (savedRentals) {
                    rentalsData = JSON.parse(savedRentals);
                } else {
                    rentalsData = [];
                }

                if (savedLessors) {
                    lessorsDirectory = JSON.parse(savedLessors);
                } else {
                    lessorsDirectory = [...defaultLessorsDirectory];
                }
            } catch (e) {
                console.warn("Storage load error, starting defaults:", e);
                rentalsData = [];
                lessorsDirectory = [...defaultLessorsDirectory];
            }
        }

        // 2. TRANSACTION CALCULATION ENGINE
        function computeTransaction(itemQuantities, lessorType, inHouseMode = 'Standard', paxCount = 1) {
            const M = itemQuantities['Mask'] || 0;
            const SF = itemQuantities['Short Fins'] || 0;
            const LF = itemQuantities['Long Fins'] || 0;
            const V = itemQuantities['Lifevest'] || 0;
            const GP = itemQuantities['GoPro'] || 0;
            const FL = itemQuantities['Floater'] || 0;

            let totalCustomerPrice = 0;
            let totalOurShare = 0;
            let totalLessorShare = 0;

            if (lessorType === "In-House" && inHouseMode === "Package") {
                const pax = Math.max(1, parseInt(paxCount) || 1);
                const packageBasePrice = pax * 500;
                const addOnsPrice = (SF * 150) + (LF * 300) + (GP * 700);

                totalCustomerPrice = packageBasePrice + addOnsPrice;
                totalOurShare = totalCustomerPrice;
                totalLessorShare = 0;

                return {
                    totalCustomerPrice,
                    totalOurShare,
                    totalLessorShare,
                    totalSets: 0,
                    isPackage: true,
                    packageType: 'In-House Package',
                    pax,
                    remMask: pax,
                    remVest: pax,
                    remShortFins: SF,
                    remLongFins: LF,
                    goProQty: GP,
                    floaterQty: 0
                };
            }

            if (lessorType === "Travel Agency") {
                const pax = Math.max(1, parseInt(paxCount) || 1);
                const ratePerHead = pax < 5 ? 350 : 300;
                const agencyBasePrice = pax * ratePerHead;
                const addOnsPrice = (SF * 150) + (LF * 300) + (GP * 700);

                totalCustomerPrice = agencyBasePrice + addOnsPrice;
                totalOurShare = totalCustomerPrice;
                totalLessorShare = 0;

                return {
                    totalCustomerPrice,
                    totalOurShare,
                    totalLessorShare,
                    totalSets: 0,
                    isPackage: true,
                    packageType: `Travel Agency (₱${ratePerHead}/hd)`,
                    pax,
                    remMask: pax,
                    remVest: pax,
                    remShortFins: SF,
                    remLongFins: LF,
                    goProQty: GP,
                    floaterQty: 0
                };
            }

            // Standard Itemized Pricing
            totalCustomerPrice = (M * 100) + (SF * 150) + (LF * 300) + (V * 100) + (GP * 700) + (FL * 100);

            // Set Bundle Rule: Combinations of Mask, Lifevest, and Short Fins
            const totalBundleGearCount = M + V + SF;
            const totalSets = Math.floor(totalBundleGearCount / 3);
            const remBundleItems = totalBundleGearCount % 3;

            if (lessorType === "In-House") {
                totalOurShare = totalCustomerPrice;
                totalLessorShare = 0;
            } else {
                totalOurShare += totalSets * 100;
                totalOurShare += remBundleItems * 50;
                totalOurShare += (LF * 150) + (GP * 400) + (FL * 50);

                totalLessorShare = Math.max(0, totalCustomerPrice - totalOurShare);
            }

            return {
                totalCustomerPrice,
                totalOurShare,
                totalLessorShare,
                totalSets,
                isPackage: false,
                pax: 0,
                remMask: M,
                remVest: V,
                remShortFins: SF,
                remLongFins: LF,
                goProQty: GP,
                floaterQty: FL
            };
        }

        function handleCheckboxChange(name) {
            const chk = document.getElementById(`chk-${name}`);
            const qtyInput = document.getElementById(`qty-${name}`);
            if (!chk || !qtyInput) return;

            if (chk.checked) {
                if (parseInt(qtyInput.value) <= 0) qtyInput.value = 1;
            } else {
                qtyInput.value = 0;
            }
            calculateModalPreview();
        }

        function handleQuantityInput(name) {
            const chk = document.getElementById(`chk-${name}`);
            const qtyInput = document.getElementById(`qty-${name}`);
            if (!chk || !qtyInput) return;

            const val = parseInt(qtyInput.value) || 0;
            if (val > 0) {
                chk.checked = true;
            } else {
                chk.checked = false;
                qtyInput.value = 0;
            }
            calculateModalPreview();
        }

        function calculateModalPreview() {
            const itemQuantities = {};
            Object.keys(GEAR_PRICING_RULES).forEach(name => {
                const qtyInput = document.getElementById(`qty-${name}`);
                itemQuantities[name] = qtyInput ? (parseInt(qtyInput.value) || 0) : 0;
            });

            const lessorTypeRadio = document.querySelector('input[name="lessorTypeRadio"]:checked');
            const lessorType = lessorTypeRadio ? lessorTypeRadio.value : 'In-House';

            const inHouseModeRadio = document.querySelector('input[name="inHouseModeRadio"]:checked');
            const inHouseMode = (lessorType === 'In-House' && inHouseModeRadio) ? inHouseModeRadio.value : 'Standard';

            let paxCount = 1;
            if (lessorType === 'In-House' && inHouseMode === 'Package') {
                const paxInput = document.getElementById('paxCount');
                paxCount = paxInput ? parseInt(paxInput.value) || 1 : 1;
            } else if (lessorType === 'Travel Agency') {
                const agencyPaxInput = document.getElementById('agencyPaxCount');
                paxCount = agencyPaxInput ? parseInt(agencyPaxInput.value) || 1 : 1;

                const badge = document.getElementById('agencyRateBadge');
                if (badge) {
                    badge.textContent = paxCount < 5 ? `₱350/head (${paxCount} pax)` : `₱300/head (${paxCount} pax)`;
                }
            }

            const res = computeTransaction(itemQuantities, lessorType, inHouseMode, paxCount);

            document.getElementById('previewTotalPrice').textContent = `₱${res.totalCustomerPrice.toLocaleString()}`;
            document.getElementById('previewOurShare').textContent = `₱${res.totalOurShare.toLocaleString()}`;
            document.getElementById('previewLessorShare').textContent = `₱${res.totalLessorShare.toLocaleString()}`;

            const banner = document.getElementById('setDiscountBanner');
            const bannerText = document.getElementById('setTextBanner');
            if (banner && bannerText) {
                if (res.isPackage) {
                    banner.classList.remove('hidden');
                    if (lessorType === 'Travel Agency') {
                        const rate = paxCount < 5 ? 350 : 300;
                        bannerText.textContent = `Travel Agency Tier Active (${paxCount} Pax @ ₱${rate}/head = ₱${(paxCount * rate).toLocaleString()})`;
                    } else {
                        bannerText.textContent = `₱500 Package Active (${res.pax} Pax = ₱${(res.pax * 500).toLocaleString()})`;
                    }
                } else if (res.totalSets > 0 && lessorType !== "In-House") {
                    banner.classList.remove('hidden');
                    bannerText.textContent = `${res.totalSets} Set Bundle(s) Active! (₱100 Our Share rate per 3 items)`;
                } else {
                    banner.classList.add('hidden');
                }
            }
        }

        function setGearVisibility(hideBasicGears) {
            const gearTitle = document.getElementById('gearSectionTitle');
            const basicGears = ['Mask', 'Lifevest', 'Floater'];

            if (hideBasicGears) {
                if (gearTitle) gearTitle.textContent = "Optional Gear Add-Ons";
                basicGears.forEach(name => {
                    const row = document.getElementById(`row-${name}`);
                    const chk = document.getElementById(`chk-${name}`);
                    const qty = document.getElementById(`qty-${name}`);
                    if (row) row.classList.add('hidden');
                    if (chk) chk.checked = false;
                    if (qty) qty.value = 0;
                });
            } else {
                if (gearTitle) gearTitle.textContent = "Select Gear Items & Quantities *";
                basicGears.forEach(name => {
                    const row = document.getElementById(`row-${name}`);
                    if (row) row.classList.remove('hidden');
                });
            }
        }

        function toggleInHouseMode() {
            const inHouseModeRadio = document.querySelector('input[name="inHouseModeRadio"]:checked');
            const mode = inHouseModeRadio ? inHouseModeRadio.value : 'Standard';

            const pkgBox = document.getElementById('packageDetailsBox');
            if (pkgBox) {
                if (mode === 'Package') pkgBox.classList.remove('hidden');
                else pkgBox.classList.add('hidden');
            }

            setGearVisibility(mode === 'Package');
            calculateModalPreview();
        }

        function toggleLessorFields() {
            const lessorTypeRadio = document.querySelector('input[name="lessorTypeRadio"]:checked');
            const type = lessorTypeRadio ? lessorTypeRadio.value : 'In-House';

            const partnerContainer = document.getElementById('partnerLessorContainer');
            const customContainer = document.getElementById('customLessorContainer');
            const inHousePkgContainer = document.getElementById('inHousePackageContainer');
            const travelAgencyContainer = document.getElementById('travelAgencyContainer');

            const customerContainer = document.getElementById('customerNameContainer');
            const depositAndDueContainer = document.getElementById('depositAndDueContainer');

            if (partnerContainer) partnerContainer.classList.add('hidden');
            if (customContainer) customContainer.classList.add('hidden');
            if (inHousePkgContainer) inHousePkgContainer.classList.add('hidden');
            if (travelAgencyContainer) travelAgencyContainer.classList.add('hidden');

            const isPackageOrAgency = (type === 'In-House' || type === 'Travel Agency');

            if (customerContainer) {
                if (isPackageOrAgency) customerContainer.classList.add('hidden');
                else customerContainer.classList.remove('hidden');
            }

            if (depositAndDueContainer) {
                if (isPackageOrAgency) depositAndDueContainer.classList.add('hidden');
                else depositAndDueContainer.classList.remove('hidden');
            }

            if (type === 'In-House') {
                if (inHousePkgContainer) inHousePkgContainer.classList.remove('hidden');
                toggleInHouseMode();
            } else if (type === 'Travel Agency') {
                if (travelAgencyContainer) travelAgencyContainer.classList.remove('hidden');
                setGearVisibility(true);
            } else {
                setGearVisibility(false);
                if (type === 'Partner Business') {
                    if (partnerContainer) partnerContainer.classList.remove('hidden');
                    populatePartnerDropdown();
                } else if (type === 'Individual Lessor') {
                    if (customContainer) customContainer.classList.remove('hidden');
                }
            }

            calculateModalPreview();
        }

        function populatePartnerDropdown() {
            const select = document.getElementById('partnerLessorSelect');
            if (!select) return;

            select.innerHTML = '';
            const partners = lessorsDirectory.filter(l => l.type === 'Partner Business');

            if (partners.length === 0) {
                const opt = document.createElement('option');
                opt.value = "Island Water Sports";
                opt.textContent = "Island Water Sports (Default)";
                select.appendChild(opt);
            } else {
                partners.forEach(p => {
                    const opt = document.createElement('option');
                    opt.value = p.name;
                    opt.textContent = p.name;
                    select.appendChild(opt);
                });
            }
        }

        function resetRentalFormQuantities() {
            Object.keys(GEAR_PRICING_RULES).forEach(name => {
                const chk = document.getElementById(`chk-${name}`);
                const qty = document.getElementById(`qty-${name}`);
                if (chk) chk.checked = false;
                if (qty) qty.value = 0;
            });

            const paxInput = document.getElementById('paxCount');
            if (paxInput) paxInput.value = 1;

            const agencyPaxInput = document.getElementById('agencyPaxCount');
            if (agencyPaxInput) agencyPaxInput.value = 1;

            const agencyName = document.getElementById('agencyNameInput');
            if (agencyName) agencyName.value = '';

            const customName = document.getElementById('customLessorName');
            if (customName) customName.value = '';
            const customPhone = document.getElementById('customLessorPhone');
            if (customPhone) customPhone.value = '';
            const customNotes = document.getElementById('customLessorNotes');
            if (customNotes) customNotes.value = '';

            const customerInput = document.getElementById('customerName');
            if (customerInput) customerInput.value = '';

            const notesInput = document.getElementById('rentalNotes');
            if (notesInput) notesInput.value = '';

            const defaultPaid = document.querySelector('input[name="paymentStatusRadio"][value="Paid"]');
            if (defaultPaid) defaultPaid.checked = true;

            const defaultInHouse = document.querySelector('input[name="lessorTypeRadio"][value="In-House"]');
            if (defaultInHouse) defaultInHouse.checked = true;

            const defaultStandardMode = document.querySelector('input[name="inHouseModeRadio"][value="Standard"]');
            if (defaultStandardMode) defaultStandardMode.checked = true;
        }

        function handleAddGearCheckboxChange(name) {
            const chk = document.getElementById(`addChk-${name}`);
            const qty = document.getElementById(`addQty-${name}`);
            if (!chk || !qty) return;

            if (chk.checked) {
                if (parseInt(qty.value) <= 0) qty.value = 1;
            } else {
                qty.value = 0;
            }
            calculateAddGearModalPreview();
        }

        function handleAddGearQuantityInput(name) {
            const chk = document.getElementById(`addChk-${name}`);
            const qty = document.getElementById(`addQty-${name}`);
            if (!chk || !qty) return;

            const val = parseInt(qty.value) || 0;
            if (val > 0) {
                chk.checked = true;
            } else {
                chk.checked = false;
                qty.value = 0;
            }
            calculateAddGearModalPreview();
        }

        function calculateAddGearModalPreview() {
            if (!currentAddGearRentalId) return;
            const rental = rentalsData.find(r => r.id === currentAddGearRentalId);
            if (!rental) return;

            const addQuantities = {};
            let addedTotal = 0;
            Object.keys(GEAR_PRICING_RULES).forEach(name => {
                const qtyInput = document.getElementById(`addQty-${name}`);
                const q = qtyInput ? (parseInt(qtyInput.value) || 0) : 0;
                addQuantities[name] = q;
                addedTotal += q * GEAR_PRICING_RULES[name].price;
            });

            const currentTotal = rental.totalPrice || 0;
            const newTotal = currentTotal + addedTotal;

            const currTotalEl = document.getElementById('addGearCurrentTotal');
            const addTotalEl = document.getElementById('addGearAddedTotal');
            const newTotalEl = document.getElementById('addGearNewTotal');

            if (currTotalEl) currTotalEl.textContent = `₱${currentTotal.toLocaleString()}`;
            if (addTotalEl) addTotalEl.textContent = `+₱${addedTotal.toLocaleString()}`;
            if (newTotalEl) newTotalEl.textContent = `₱${newTotal.toLocaleString()}`;
        }

        function handleAddGearSubmit(e) {
            e.preventDefault();
            if (!currentAddGearRentalId) return;

            const rental = rentalsData.find(r => r.id === currentAddGearRentalId);
            if (!rental) return;

            const combinedItems = { ...rental.items };
            let addedCount = 0;

            Object.keys(GEAR_PRICING_RULES).forEach(name => {
                const qtyInput = document.getElementById(`addQty-${name}`);
                const addQty = qtyInput ? (parseInt(qtyInput.value) || 0) : 0;
                if (addQty > 0) {
                    combinedItems[name] = (combinedItems[name] || 0) + addQty;
                    addedCount += addQty;
                }
            });

            if (addedCount <= 0) {
                showToast("Please select at least 1 gear item to append.", "warning");
                return;
            }

            const inHouseMode = rental.inHouseMode || 'Standard';
            const paxCount = rental.pax || 1;
            const computed = computeTransaction(combinedItems, rental.lessorType, inHouseMode, paxCount);

            rental.items = combinedItems;
            rental.totalPrice = computed.totalCustomerPrice;
            rental.ourShare = computed.totalOurShare;
            rental.lessorShare = computed.totalLessorShare;

            saveState();
            closeAddGearModal();
            renderTable();
            updateKPIs();
            showToast(`Successfully added ${addedCount} item(s) to ${rental.customerName}'s order!`, "success");
        }

        function handleRentalSubmit(e) {
            e.preventDefault();

            let customerName = document.getElementById('customerName').value.trim();
            const notes = document.getElementById('rentalNotes').value.trim();
            const paymentStatusRadio = document.querySelector('input[name="paymentStatusRadio"]:checked');
            const paymentStatus = paymentStatusRadio ? paymentStatusRadio.value : 'Paid';

            const lessorTypeRadio = document.querySelector('input[name="lessorTypeRadio"]:checked');
            const lessorType = lessorTypeRadio ? lessorTypeRadio.value : 'In-House';

            const inHouseModeRadio = document.querySelector('input[name="inHouseModeRadio"]:checked');
            const inHouseMode = (lessorType === 'In-House' && inHouseModeRadio) ? inHouseModeRadio.value : 'Standard';

            let paxCount = 1;
            let lessorSource = 'In-House Hub';

            if (lessorType === 'In-House') {
                if (inHouseMode === 'Package') {
                    paxCount = parseInt(document.getElementById('paxCount').value) || 1;
                    lessorSource = `In-House Hub (${paxCount} Pax Package)`;
                }
                if (!customerName) {
                    customerName = `In-House Guest (${paxCount} Pax)`;
                }
            } else if (lessorType === 'Partner Business') {
                lessorSource = document.getElementById('partnerLessorSelect').value || 'Partner Business';
                if (!customerName) {
                    showToast("Please enter the customer / guest full name.", "warning");
                    return;
                }
            } else if (lessorType === 'Individual Lessor') {
                const cName = document.getElementById('customLessorName').value.trim();
                const cPhone = document.getElementById('customLessorPhone').value.trim();
                lessorSource = cName ? `Individual: ${cName}` : 'Individual Guide';

                if (!customerName) {
                    showToast("Please enter the customer / guest full name.", "warning");
                    return;
                }

                if (cName) {
                    const exists = lessorsDirectory.some(l => l.name.toLowerCase() === cName.toLowerCase());
                    if (!exists) {
                        lessorsDirectory.push({
                            id: Date.now(),
                            name: cName,
                            type: 'Individual Lessor',
                            location: 'Freelance',
                            phone: cPhone || 'N/A',
                            commission: 'Standard Split'
                        });
                    }
                }
            } else if (lessorType === 'Travel Agency') {
                const agencyName = document.getElementById('agencyNameInput').value.trim();
                paxCount = parseInt(document.getElementById('agencyPaxCount').value) || 1;
                lessorSource = agencyName ? `Agency: ${agencyName} (${paxCount} Pax)` : `Travel Agency (${paxCount} Pax)`;
                if (!customerName) {
                    customerName = agencyName ? `${agencyName} Guest` : `Travel Agency Guest (${paxCount} Pax)`;
                }
            }

            const itemQuantities = {};
            let totalItemsCount = 0;

            Object.keys(GEAR_PRICING_RULES).forEach(name => {
                const qtyInput = document.getElementById(`qty-${name}`);
                const q = qtyInput ? (parseInt(qtyInput.value) || 0) : 0;
                itemQuantities[name] = q;
                totalItemsCount += q;
            });

            if (lessorType === 'In-House' && inHouseMode === 'Package') {
                itemQuantities['Mask'] = paxCount;
                itemQuantities['Lifevest'] = paxCount;
                totalItemsCount += (paxCount * 2);
            } else if (lessorType === 'Travel Agency') {
                itemQuantities['Mask'] = paxCount;
                itemQuantities['Lifevest'] = paxCount;
                totalItemsCount += (paxCount * 2);
            }

            if (totalItemsCount <= 0) {
                showToast("Please select at least 1 gear item quantity to issue.", "warning");
                return;
            }

            const depositHeld = (lessorType === 'In-House' || lessorType === 'Travel Agency') 
                ? 'None / Included' 
                : document.getElementById('depositHeld').value;
            const dueTime = document.getElementById('dueTime').value || '17:00';

            const computed = computeTransaction(itemQuantities, lessorType, inHouseMode, paxCount);

            const newRental = {
                id: Date.now(),
                customerName,
                notes,
                items: itemQuantities,
                lessorSource,
                lessorType,
                inHouseMode,
                pax: paxCount,
                depositHeld,
                dueTime,
                totalPrice: computed.totalCustomerPrice,
                ourShare: computed.totalOurShare,
                lessorShare: computed.totalLessorShare,
                paymentStatus,
                status: 'Active',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            rentalsData.unshift(newRental);
            saveState();
            closeRentalModal();
            renderTable();
            updateKPIs();
            showToast(`Rental order issued successfully for ${customerName}!`, "success");
        }

        function handleNewLessorSubmit(e) {
            e.preventDefault();
            const name = document.getElementById('newLessorName').value.trim();
            const type = document.getElementById('newLessorType').value;
            const location = document.getElementById('newLessorLocation').value.trim() || 'Main Station';
            const phone = document.getElementById('newLessorPhone').value.trim() || 'N/A';
            const commission = document.getElementById('newLessorCommission').value.trim() || 'Standard Split';

            if (!name) return;

            const newLessor = {
                id: Date.now(),
                name,
                type,
                location,
                phone,
                commission
            };

            lessorsDirectory.push(newLessor);
            saveState();
            closeLessorModal();
            renderLessorsGrid();
            populatePartnerDropdown();
            showToast(`Registered new lessor: ${name}`, "success");
        }

        function handleEditLessorSubmit(e) {
            e.preventDefault();
            const id = parseInt(document.getElementById('editLessorId').value);
            const lessor = lessorsDirectory.find(l => l.id === id);
            if (!lessor) return;

            const oldName = lessor.name;
            lessor.name = document.getElementById('editLessorName').value.trim();
            lessor.type = document.getElementById('editLessorType').value;
            lessor.location = document.getElementById('editLessorLocation').value.trim();
            lessor.phone = document.getElementById('editLessorPhone').value.trim();
            lessor.commission = document.getElementById('editLessorCommission').value.trim();

            if (oldName !== lessor.name) {
                rentalsData.forEach(r => {
                    if (r.lessorSource === oldName) r.lessorSource = lessor.name;
                    if (r.lessorSource === `Individual: ${oldName}`) r.lessorSource = `Individual: ${lessor.name}`;
                });
            }

            saveState();
            closeEditLessorModal();
            renderLessorsGrid();
            renderTable();
            populatePartnerDropdown();
            showToast(`Updated lessor profile for ${lessor.name}`, "success");
        }

        function deleteLessor(id) {
            const lessor = lessorsDirectory.find(l => l.id === id);
            if (!lessor) return;

            const hasActiveRentals = rentalsData.some(r => 
                r.lessorSource === lessor.name || 
                r.lessorSource === `Individual: ${lessor.name}`
            );

            if (hasActiveRentals) {
                showToast(`Cannot delete ${lessor.name} because they have active rentals logged.`, "warning");
                return;
            }

            lessorsDirectory = lessorsDirectory.filter(l => l.id !== id);
            saveState();
            renderLessorsGrid();
            populatePartnerDropdown();
            showToast(`Removed lessor ${lessor.name}`, "info");
        }

        function renderTable() {
            const tbody = document.getElementById('rentalsTableBody');
            const emptyState = document.getElementById('emptyTableState');
            if (!tbody) return;

            const searchVal = (document.getElementById('searchInput')?.value || '').toLowerCase();
            const statusVal = document.getElementById('statusFilter')?.value || 'ALL';
            const paymentVal = document.getElementById('paymentFilter')?.value || 'ALL';

            const filtered = rentalsData.filter(r => {
                const matchesSearch = r.customerName.toLowerCase().includes(searchVal) ||
                                      (r.notes && r.notes.toLowerCase().includes(searchVal)) ||
                                      r.lessorSource.toLowerCase().includes(searchVal);
                const matchesStatus = statusVal === 'ALL' || r.status === statusVal;
                const matchesPayment = paymentVal === 'ALL' || r.paymentStatus === paymentVal;
                return matchesSearch && matchesStatus && matchesPayment;
            });

            if (filtered.length === 0) {
                tbody.innerHTML = '';
                if (emptyState) emptyState.classList.remove('hidden');
                refreshIcons();
                return;
            }

            if (emptyState) emptyState.classList.add('hidden');

            tbody.innerHTML = filtered.map(r => {
                const itemsStr = Object.entries(r.items || {})
                    .filter(([_, qty]) => qty > 0)
                    .map(([name, qty]) => `<span class="inline-block bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded text-[11px] font-medium mr-1 mb-1">${name} x${qty}</span>`)
                    .join('');

                let statusBadgeClass = 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20';
                if (r.status === 'Overdue') statusBadgeClass = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
                if (r.status === 'Returned') statusBadgeClass = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
                if (r.status === 'Damaged') statusBadgeClass = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';

                let sourceBadge = `<span class="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md font-semibold text-[10px]">${r.lessorSource}</span>`;
                if (r.lessorSource.startsWith('Individual:')) {
                    sourceBadge = `<span class="px-2 py-0.5 bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 rounded-md font-bold text-[10px]">${r.lessorSource}</span>`;
                } else if (r.lessorType === 'Partner Business') {
                    sourceBadge = `<span class="px-2 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 rounded-md font-bold text-[10px]">${r.lessorSource}</span>`;
                }

                const paymentBadgeClass = r.paymentStatus === 'Paid' 
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';

                return `
                    <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                        <td class="py-3.5 px-4 sm:px-5 font-semibold text-slate-900 dark:text-white">
                            <div>${r.customerName}</div>
                            ${r.notes ? `<div class="text-[10px] font-normal text-slate-400 italic mt-0.5">${r.notes}</div>` : ''}
                            <div class="text-[10px] font-normal text-slate-400">Due: ${r.dueTime}</div>
                        </td>
                        <td class="py-3.5 px-4 sm:px-5">${itemsStr || 'None'}</td>
                        <td class="py-3.5 px-4 sm:px-5">${sourceBadge}</td>
                        <td class="py-3.5 px-4 sm:px-5 font-medium text-slate-600 dark:text-slate-300">${r.depositHeld}</td>
                        <td class="py-3.5 px-4 sm:px-5 font-bold text-slate-900 dark:text-white">₱${r.totalPrice.toLocaleString()}</td>
                        <td class="py-3.5 px-4 sm:px-5 font-bold text-teal-600 dark:text-teal-400">₱${r.ourShare.toLocaleString()}</td>
                        <td class="py-3.5 px-4 sm:px-5">
                            <select onchange="updatePaymentStatus(${r.id}, this.value)" class="text-[10px] font-bold px-2 py-1 rounded-lg border focus:outline-none ${paymentBadgeClass}">
                                <option value="Paid" ${r.paymentStatus === 'Paid' ? 'selected' : ''}>Paid</option>
                                <option value="Unpaid" ${r.paymentStatus === 'Unpaid' ? 'selected' : ''}>Unpaid</option>
                            </select>
                        </td>
                        <td class="py-3.5 px-4 sm:px-5">
                            <select onchange="updateStatus(${r.id}, this.value)" class="text-[10px] font-bold px-2 py-1 rounded-lg border focus:outline-none ${statusBadgeClass}">
                                <option value="Active" ${r.status === 'Active' ? 'selected' : ''}>Active</option>
                                <option value="Returned" ${r.status === 'Returned' ? 'selected' : ''}>Returned</option>
                                <option value="Overdue" ${r.status === 'Overdue' ? 'selected' : ''}>Overdue</option>
                                <option value="Damaged" ${r.status === 'Damaged' ? 'selected' : ''}>Damaged</option>
                            </select>
                        </td>
                        <td class="py-3.5 px-4 sm:px-5 text-right space-x-1">
                            <button onclick="openAddGearModal(${r.id})" class="px-2 py-1 bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 dark:text-teal-400 rounded-lg text-[10px] font-bold transition cursor-pointer" title="Add Additional Gear">
                                + Gear
                            </button>
                            <button onclick="deleteRental(${r.id})" class="p-1 text-slate-400 hover:text-rose-500 transition cursor-pointer" title="Delete Transaction">
                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');

            refreshIcons();
        }

        function updateStatus(id, newStatus) {
            const rental = rentalsData.find(r => r.id === id);
            if (rental) {
                rental.status = newStatus;
                saveState();
                renderTable();
                updateKPIs();
                showToast(`Updated transaction status for ${rental.customerName} to ${newStatus}`, "info");
            }
        }

        function updatePaymentStatus(id, newPaymentStatus) {
            const rental = rentalsData.find(r => r.id === id);
            if (rental) {
                rental.paymentStatus = newPaymentStatus;
                saveState();
                renderTable();
                updateKPIs();
                showToast(`Payment for ${rental.customerName} set to ${newPaymentStatus}`, "info");
            }
        }

        function deleteRental(id) {
            rentalsData = rentalsData.filter(r => r.id !== id);
            saveState();
            renderTable();
            updateKPIs();
            showToast("Rental record deleted.", "info");
        }

        function filterTable() {
            renderTable();
        }

        function updateKPIs() {
            const activeCount = rentalsData.filter(r => r.status === 'Active').length;
            const overdueCount = rentalsData.filter(r => r.status === 'Overdue').length;

            const totalRev = rentalsData.reduce((acc, r) => acc + (r.totalPrice || 0), 0);
            const ourShare = rentalsData.reduce((acc, r) => acc + (r.ourShare || 0), 0);
            const lessorShare = rentalsData.reduce((acc, r) => acc + (r.lessorShare || 0), 0);

            const activeEl = document.getElementById('kpiActiveRentals');
            const overdueEl = document.getElementById('kpiOverdue');
            const totalRevEl = document.getElementById('kpiTotalRevenue');
            const ourShareEl = document.getElementById('kpiOurShare');
            const subPayoutEl = document.getElementById('kpiLessorPayoutSub');

            if (activeEl) activeEl.textContent = activeCount;
            if (overdueEl) overdueEl.textContent = overdueCount;
            if (totalRevEl) totalRevEl.textContent = `₱${totalRev.toLocaleString()}`;
            if (ourShareEl) ourShareEl.textContent = `₱${ourShare.toLocaleString()}`;
            if (subPayoutEl) subPayoutEl.textContent = `₱${lessorShare.toLocaleString()} payout to lessors`;
        }

        function renderInventoryGrid() {
            const grid = document.getElementById('inventoryGrid');
            if (!grid) return;

            const outCounts = {};
            rentalsData.filter(r => r.status === 'Active' || r.status === 'Overdue').forEach(r => {
                Object.entries(r.items || {}).forEach(([code, qty]) => {
                    outCounts[code] = (outCounts[code] || 0) + qty;
                });
            });

            grid.innerHTML = gearStockDirectory.map(item => {
                const rentedOut = outCounts[item.code] || 0;
                const available = Math.max(0, item.totalStock - rentedOut);
                const percentAvailable = Math.round((available / item.totalStock) * 100);

                return `
                    <div class="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
                        <div class="flex items-start justify-between">
                            <div class="flex items-center space-x-3">
                                <div class="p-2.5 bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 rounded-xl">
                                    <i data-lucide="${item.icon}" class="w-5 h-5"></i>
                                </div>
                                <div>
                                    <h4 class="font-bold text-slate-900 dark:text-white text-sm">${item.name}</h4>
                                    <span class="text-[11px] text-slate-400">Total Stock: ${item.totalStock} units</span>
                                </div>
                            </div>
                            <span class="text-xs font-extrabold px-2.5 py-1 rounded-lg ${available > 10 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'}">
                                ${available} Available
                            </span>
                        </div>

                        <div>
                            <div class="flex justify-between text-[11px] font-semibold mb-1">
                                <span class="text-slate-500 dark:text-slate-400">Rented Out: ${rentedOut}</span>
                                <span class="text-slate-700 dark:text-slate-300">${percentAvailable}% Stock Free</span>
                            </div>
                            <div class="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                <div class="bg-teal-500 h-full rounded-full transition-all duration-300" style="width: ${percentAvailable}%"></div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            refreshIcons();
        }

        function renderLessorsGrid() {
            const grid = document.getElementById('lessorsGrid');
            if (!grid) return;

            if (lessorsDirectory.length === 0) {
                grid.innerHTML = `<p class="text-xs text-slate-400 col-span-3">No registered third-party lessors yet.</p>`;
                return;
            }

            grid.innerHTML = lessorsDirectory.map(l => {
                const activeCount = rentalsData.filter(r => 
                    (r.status === 'Active' || r.status === 'Overdue') && 
                    (r.lessorSource === l.name || r.lessorSource === `Individual: ${l.name}`)
                ).length;

                const isPartner = l.type === 'Partner Business';
                const badgeClass = isPartner 
                    ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' 
                    : 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20';

                return `
                    <div class="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
                        <div class="flex items-start justify-between">
                            <div>
                                <span class="px-2 py-0.5 rounded text-[10px] font-bold border ${badgeClass}">${l.type}</span>
                                <h4 class="font-bold text-slate-900 dark:text-white text-base mt-2">${l.name}</h4>
                                <p class="text-xs text-slate-400">${l.location || 'Station Base'}</p>
                            </div>
                            <div class="flex items-center space-x-1">
                                <button onclick="openEditLessorModal(${l.id})" class="p-1.5 text-slate-400 hover:text-teal-500 transition cursor-pointer" title="Edit Lessor">
                                    <i data-lucide="edit-2" class="w-4 h-4"></i>
                                </button>
                                <button onclick="deleteLessor(${l.id})" class="p-1.5 text-slate-400 hover:text-rose-500 transition cursor-pointer" title="Delete Lessor">
                                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                                </button>
                            </div>
                        </div>

                        <div class="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs space-y-1">
                            <div class="flex justify-between text-slate-500 dark:text-slate-400">
                                <span>Phone Contact:</span>
                                <span class="font-medium text-slate-800 dark:text-slate-200">${l.phone || 'N/A'}</span>
                            </div>
                            <div class="flex justify-between text-slate-500 dark:text-slate-400">
                                <span>Active Rental Gear Out:</span>
                                <span class="font-bold text-teal-600 dark:text-teal-400">${activeCount} Order(s)</span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            refreshIcons();
        }

        function exportToPDF() {
            if (!window.jspdf) {
                showToast("PDF Export library loading...", "info");
                return;
            }

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            doc.setFontSize(16);
            doc.text("AquaTrack - Snorkeling Gear Rental Report", 14, 20);
            doc.setFontSize(10);
            doc.text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 26);

            const tableColumn = ["Guest Name", "Gear Rented", "Source", "Deposit", "Total (₱)", "Our Share (₱)", "Payment", "Status"];
            const tableRows = rentalsData.map(r => [
                r.customerName,
                Object.entries(r.items || {}).filter(([_, q]) => q > 0).map(([n, q]) => `${n} x${q}`).join(', '),
                r.lessorSource,
                r.depositHeld,
                `₱${r.totalPrice}`,
                `₱${r.ourShare}`,
                r.paymentStatus,
                r.status
            ]);

            doc.autoTable({
                head: [tableColumn],
                body: tableRows,
                startY: 32,
                styles: { fontSize: 8 },
                headStyles: { fillColor: [13, 148, 136] }
            });

            doc.save(`AquaTrack_Rental_Report_${Date.now()}.pdf`);
            showToast("PDF report exported successfully!", "success");
        }

        window.onload = function() {
            loadSavedState();
            renderTable();
            updateKPIs();
            populatePartnerDropdown();
            refreshIcons();
        };
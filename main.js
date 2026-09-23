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
            if (window.lucide) lucide.createIcons();

            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transition = 'opacity 0.3s ease';
                setTimeout(() => toast.remove(), 300);
            }, 3500);
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
        }

        function toggleMobileSidebar() {
            const sidebar = document.getElementById('sidebar');
            const backdrop = document.getElementById('mobileSidebarBackdrop');
            if (!sidebar || !backdrop) return;

            const isClosed = sidebar.classList.contains('-translate-x-full');
            if (isClosed) {
                sidebar.classList.remove('-translate-x-full');
                backdrop.classList.remove('hidden');
            } else {
                sidebar.classList.add('-translate-x-full');
                backdrop.classList.add('hidden');
            }
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
        }

        // 2. TRANSACTION CALCULATION ENGINE
        function computeTransaction(itemQuantities, lessorType) {
            const M = itemQuantities['Mask'] || 0;
            const SF = itemQuantities['Short Fins'] || 0;
            const LF = itemQuantities['Long Fins'] || 0;
            const V = itemQuantities['Lifevest'] || 0;
            const GP = itemQuantities['GoPro'] || 0;
            const FL = itemQuantities['Floater'] || 0;

            // Total Customer Price: Exact sum of all item prices
            const totalCustomerPrice = (M * 100) + (SF * 150) + (LF * 300) + (V * 100) + (GP * 700) + (FL * 100);

            // Universal 3-Gear Bundle Rule: Mask, Lifevest, Short Fins
            const totalBundleGearCount = M + V + SF;
            const totalSets = Math.floor(totalBundleGearCount / 3);
            const remBundleItems = totalBundleGearCount % 3;

            let totalOurShare = 0;
            let totalLessorShare = 0;

            if (lessorType === "In-House") {
                totalOurShare = totalCustomerPrice;
                totalLessorShare = 0;
            } else {
                // Partner or Freelance Lessor: ₱100 Our Share per 3-gear set
                totalOurShare += totalSets * 100;
                // Remaining unbundled gear from Mask, Vest, Short Fins yield ₱50 Our Share each
                totalOurShare += remBundleItems * 50;
                // Long Fins, GoPro, Floater yield standard per-item commission rates
                totalOurShare += (LF * 150) + (GP * 400) + (FL * 50);

                totalLessorShare = Math.max(0, totalCustomerPrice - totalOurShare);
            }

            return {
                totalCustomerPrice,
                totalOurShare,
                totalLessorShare,
                totalSets,
                remMask: M,
                remVest: V,
                remShortFins: SF,
                remLongFins: LF,
                goProQty: GP,
                floaterQty: FL
            };
        }

        // Modal Checkbox and Quantity Synchronization
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

            const res = computeTransaction(itemQuantities, lessorType);

            document.getElementById('previewTotalPrice').textContent = `₱${res.totalCustomerPrice.toLocaleString()}`;
            document.getElementById('previewOurShare').textContent = `₱${res.totalOurShare.toLocaleString()}`;
            document.getElementById('previewLessorShare').textContent = `₱${res.totalLessorShare.toLocaleString()}`;

            const banner = document.getElementById('setDiscountBanner');
            const bannerText = document.getElementById('setTextBanner');
            if (banner && bannerText) {
                if (res.totalSets > 0 && lessorType !== "In-House") {
                    banner.classList.remove('hidden');
                    bannerText.textContent = `${res.totalSets} Set Bundle(s) Active! (₱100 Our Share rate per 3 items)`;
                } else {
                    banner.classList.add('hidden');
                }
            }
        }

        function resetRentalFormQuantities() {
            Object.keys(GEAR_PRICING_RULES).forEach(name => {
                const chk = document.getElementById(`chk-${name}`);
                const qty = document.getElementById(`qty-${name}`);
                if (chk) chk.checked = false;
                if (qty) qty.value = 0;
            });
            calculateModalPreview();
        }

        function toggleLessorFields() {
            const lessorTypeRadio = document.querySelector('input[name="lessorTypeRadio"]:checked');
            const type = lessorTypeRadio ? lessorTypeRadio.value : 'In-House';

            const partnerContainer = document.getElementById('partnerLessorContainer');
            const customContainer = document.getElementById('customLessorContainer');

            if (partnerContainer) partnerContainer.classList.add('hidden');
            if (customContainer) customContainer.classList.add('hidden');

            if (type === 'Partner Business') {
                if (partnerContainer) partnerContainer.classList.remove('hidden');
                populatePartnerDropdown();
            } else if (type === 'Individual Lessor') {
                if (customContainer) customContainer.classList.remove('hidden');
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

        // Modal Open / Close Helpers
        function openRentalModal() {
            resetRentalFormQuantities();
            toggleLessorFields();
            document.getElementById('rentalModal').classList.remove('hidden');
        }

        function closeRentalModal() {
            document.getElementById('rentalModal').classList.add('hidden');
        }

        function openLessorModal() {
            document.getElementById('addLessorModal').classList.remove('hidden');
        }

        function closeLessorModal() {
            document.getElementById('addLessorModal').classList.add('hidden');
        }

        function openEditLessorModal(id) {
            const lessor = lessorsDirectory.find(l => l.id === id);
            if (!lessor) return;

            document.getElementById('editLessorId').value = lessor.id;
            document.getElementById('editLessorName').value = lessor.name;
            document.getElementById('editLessorType').value = lessor.type;
            document.getElementById('editLessorLocation').value = lessor.location || '';
            document.getElementById('editLessorPhone').value = lessor.phone || '';
            document.getElementById('editLessorCommission').value = lessor.commission || '';

            document.getElementById('editLessorModal').classList.remove('hidden');
        }

        function closeEditLessorModal() {
            document.getElementById('editLessorModal').classList.add('hidden');
        }

        function handleRentalSubmit(event) {
            event.preventDefault();

            const customer = document.getElementById('customerName').value.trim();
            const notes = document.getElementById('rentalNotes')?.value.trim() || '';
            const deposit = document.getElementById('depositHeld').value;
            const dueTime = document.getElementById('dueTime').value;
            const paymentStatusRadio = document.querySelector('input[name="paymentStatusRadio"]:checked');
            const paymentStatus = paymentStatusRadio ? paymentStatusRadio.value : 'Paid';
            const lessorTypeRadio = document.querySelector('input[name="lessorTypeRadio"]:checked');
            const lessorType = lessorTypeRadio ? lessorTypeRadio.value : 'In-House';

            let lessorName = "In-House";
            if (lessorType === "Partner Business") {
                lessorName = document.getElementById('partnerLessorSelect').value;
            } else if (lessorType === "Individual Lessor") {
                const customName = document.getElementById('customLessorName').value.trim();
                if (!customName) {
                    showToast("Please enter the Individual Lessor / Guide's Name.", "warning");
                    return;
                }
                lessorName = customName;

                const phone = document.getElementById('customLessorPhone').value.trim();
                const lessorNotes = document.getElementById('customLessorNotes').value.trim();

                if (!lessorsDirectory.some(l => l.name.toLowerCase() === customName.toLowerCase())) {
                    lessorsDirectory.push({
                        id: Date.now(),
                        name: customName,
                        type: "Individual Lessor",
                        location: "Freelance / Local",
                        phone: phone || "N/A",
                        commission: lessorNotes || "Standard Split"
                    });
                    renderLessorsGrid();
                }
            }

            const itemQuantities = {};
            let totalItemCount = 0;
            Object.keys(GEAR_PRICING_RULES).forEach(name => {
                const qtyInput = document.getElementById(`qty-${name}`);
                const qty = qtyInput ? parseInt(qtyInput.value) || 0 : 0;
                itemQuantities[name] = qty;
                totalItemCount += qty;
            });

            if (totalItemCount === 0) {
                showToast("Please select at least one gear item with a quantity greater than zero.", "warning");
                return;
            }

            const pricingBreakdown = computeTransaction(itemQuantities, lessorType);

            const formattedParts = [];
            if (pricingBreakdown.totalSets > 0) formattedParts.push(`Gear Set x${pricingBreakdown.totalSets}`);
            if (pricingBreakdown.remMask > 0 && pricingBreakdown.totalSets === 0) formattedParts.push(`Mask x${pricingBreakdown.remMask}`);
            if (pricingBreakdown.remVest > 0 && pricingBreakdown.totalSets === 0) formattedParts.push(`Lifevest x${pricingBreakdown.remVest}`);
            if (pricingBreakdown.remShortFins > 0 && pricingBreakdown.totalSets === 0) formattedParts.push(`Short Fins x${pricingBreakdown.remShortFins}`);
            if (pricingBreakdown.remLongFins > 0) formattedParts.push(`Long Fins x${pricingBreakdown.remLongFins}`);
            if (pricingBreakdown.goProQty > 0) formattedParts.push(`GoPro x${pricingBreakdown.goProQty}`);
            if (pricingBreakdown.floaterQty > 0) formattedParts.push(`Floater x${pricingBreakdown.floaterQty}`);

            const newRecord = {
                id: Date.now(),
                customer: customer,
                notes: notes,
                items: formattedParts.join(', '),
                itemQuantities: { ...itemQuantities },
                lessorType: lessorType,
                lessorName: lessorName,
                deposit: deposit,
                dueTime: dueTime,
                paymentStatus: paymentStatus,
                status: 'Active',
                totalCustomerPrice: pricingBreakdown.totalCustomerPrice,
                totalOurShare: pricingBreakdown.totalOurShare,
                totalLessorShare: pricingBreakdown.totalLessorShare
            };

            rentalsData.unshift(newRecord);
            saveState();
            updateKPIs();
            filterTable();
            renderInventoryGrid();
            renderLessorsGrid();
            closeRentalModal();

            document.getElementById('newRentalForm').reset();
            resetRentalFormQuantities();
            toggleLessorFields();
            showToast("Rental order issued successfully!", "success");
        }

        function openAddGearModal(rentalId) {
            const rental = rentalsData.find(r => r.id === rentalId);
            if (!rental) return;

            currentAddGearRentalId = rentalId;

            document.getElementById('addGearCustomerSubtitle').textContent = `Append items for: ${rental.customer}`;
            document.getElementById('currentRentedItemsDisplay').textContent = rental.items || 'None';

            Object.keys(GEAR_PRICING_RULES).forEach(name => {
                const chk = document.getElementById(`addChk-${name}`);
                const qty = document.getElementById(`addQty-${name}`);
                if (chk) chk.checked = false;
                if (qty) qty.value = 0;
            });

            calculateAddGearPreview();
            document.getElementById('addGearModal').classList.remove('hidden');
        }

        function closeAddGearModal() {
            document.getElementById('addGearModal').classList.add('hidden');
            currentAddGearRentalId = null;
        }

        function handleAddGearCheckboxChange(name) {
            const chk = document.getElementById(`addChk-${name}`);
            const qtyInput = document.getElementById(`addQty-${name}`);
            if (!chk || !qtyInput) return;

            if (chk.checked) {
                if (parseInt(qtyInput.value) <= 0) qtyInput.value = 1;
            } else {
                qtyInput.value = 0;
            }
            calculateAddGearPreview();
        }

        function handleAddGearQuantityInput(name) {
            const chk = document.getElementById(`addChk-${name}`);
            const qtyInput = document.getElementById(`addQty-${name}`);
            if (!chk || !qtyInput) return;

            const val = parseInt(qtyInput.value) || 0;
            if (val > 0) {
                chk.checked = true;
            } else {
                chk.checked = false;
                qtyInput.value = 0;
            }
            calculateAddGearPreview();
        }

        function calculateAddGearPreview() {
            const rental = rentalsData.find(r => r.id === currentAddGearRentalId);
            if (!rental) return;

            const additionalQuantities = {};
            let addedTotal = 0;

            Object.keys(GEAR_PRICING_RULES).forEach(name => {
                const qty = parseInt(document.getElementById(`addQty-${name}`)?.value) || 0;
                additionalQuantities[name] = qty;
                addedTotal += qty * GEAR_PRICING_RULES[name].price;
            });

            const currentTotal = rental.totalCustomerPrice || 0;
            const newTotal = currentTotal + addedTotal;

            document.getElementById('addGearCurrentTotal').textContent = `₱${currentTotal.toLocaleString()}`;
            document.getElementById('addGearAddedTotal').textContent = `+₱${addedTotal.toLocaleString()}`;
            document.getElementById('addGearNewTotal').textContent = `₱${newTotal.toLocaleString()}`;
        }

        function handleAddGearSubmit(event) {
            event.preventDefault();
            const rental = rentalsData.find(r => r.id === currentAddGearRentalId);
            if (!rental) return;

            const newQuantities = { ...rental.itemQuantities };
            let addedItemCount = 0;

            Object.keys(GEAR_PRICING_RULES).forEach(name => {
                const qty = parseInt(document.getElementById(`addQty-${name}`)?.value) || 0;
                if (qty > 0) {
                    newQuantities[name] = (newQuantities[name] || 0) + qty;
                    addedItemCount += qty;
                }
            });

            if (addedItemCount === 0) {
                showToast("Please select at least one additional gear item to add.", "warning");
                return;
            }

            const pricingBreakdown = computeTransaction(newQuantities, rental.lessorType);

            const formattedParts = [];
            if (pricingBreakdown.totalSets > 0) formattedParts.push(`Gear Set x${pricingBreakdown.totalSets}`);
            if (pricingBreakdown.remMask > 0 && pricingBreakdown.totalSets === 0) formattedParts.push(`Mask x${pricingBreakdown.remMask}`);
            if (pricingBreakdown.remVest > 0 && pricingBreakdown.totalSets === 0) formattedParts.push(`Lifevest x${pricingBreakdown.remVest}`);
            if (pricingBreakdown.remShortFins > 0 && pricingBreakdown.totalSets === 0) formattedParts.push(`Short Fins x${pricingBreakdown.remShortFins}`);
            if (pricingBreakdown.remLongFins > 0) formattedParts.push(`Long Fins x${pricingBreakdown.remLongFins}`);
            if (pricingBreakdown.goProQty > 0) formattedParts.push(`GoPro x${pricingBreakdown.goProQty}`);
            if (pricingBreakdown.floaterQty > 0) formattedParts.push(`Floater x${pricingBreakdown.floaterQty}`);

            rental.itemQuantities = newQuantities;
            rental.items = formattedParts.join(', ');
            rental.totalCustomerPrice = pricingBreakdown.totalCustomerPrice;
            rental.totalOurShare = pricingBreakdown.totalOurShare;
            rental.totalLessorShare = pricingBreakdown.totalLessorShare;

            saveState();
            updateKPIs();
            filterTable();
            renderInventoryGrid();
            closeAddGearModal();
            showToast("Additional gear appended successfully!", "success");
        }

        function handleNewLessorSubmit(event) {
            event.preventDefault();
            const name = document.getElementById('newLessorName').value.trim();
            const type = document.getElementById('newLessorType').value;
            const location = document.getElementById('newLessorLocation').value.trim();
            const phone = document.getElementById('newLessorPhone').value.trim();
            const commission = document.getElementById('newLessorCommission').value.trim();

            if (!name) return;

            lessorsDirectory.push({
                id: Date.now(),
                name,
                type,
                location: location || "Station",
                phone: phone || "N/A",
                commission: commission || "Standard Split"
            });

            saveState();
            renderLessorsGrid();
            populatePartnerDropdown();
            closeLessorModal();
            showToast("New lessor registered successfully!", "success");
        }

        function handleEditLessorSubmit(event) {
            event.preventDefault();
            const id = parseInt(document.getElementById('editLessorId').value);
            const name = document.getElementById('editLessorName').value.trim();
            const type = document.getElementById('editLessorType').value;
            const location = document.getElementById('editLessorLocation').value.trim();
            const phone = document.getElementById('editLessorPhone').value.trim();
            const commission = document.getElementById('editLessorCommission').value.trim();

            const lessor = lessorsDirectory.find(l => l.id === id);
            if (!lessor) return;

            const oldName = lessor.name;
            lessor.name = name;
            lessor.type = type;
            lessor.location = location || "Station";
            lessor.phone = phone || "N/A";
            lessor.commission = commission || "Standard Split";

            // Update rental records matching old name
            rentalsData.forEach(r => {
                if (r.lessorName === oldName) r.lessorName = name;
            });

            saveState();
            renderLessorsGrid();
            filterTable();
            populatePartnerDropdown();
            closeEditLessorModal();
            showToast("Lessor details updated!", "success");
        }

        function deleteLessor(id) {
            const lessor = lessorsDirectory.find(l => l.id === id);
            if (!lessor) return;

            const activeCount = rentalsData.filter(r => r.lessorName === lessor.name && (r.status === 'Active' || r.status === 'Overdue')).length;
            if (activeCount > 0) {
                showToast(`Cannot delete "${lessor.name}" because they have ${activeCount} active rental(s).`, "warning");
                return;
            }

            lessorsDirectory = lessorsDirectory.filter(l => l.id !== id);
            saveState();
            renderLessorsGrid();
            populatePartnerDropdown();
            showToast("Lessor removed from directory.", "info");
        }

        function updateKPIs() {
            let activeCount = 0;
            let overdueCount = 0;
            let totalRevenue = 0;
            let ourShare = 0;
            let lessorPayout = 0;

            rentalsData.forEach(r => {
                if (r.status === 'Active') activeCount++;
                if (r.status === 'Overdue') overdueCount++;

                totalRevenue += r.totalCustomerPrice || 0;
                ourShare += r.totalOurShare || 0;
                lessorPayout += r.totalLessorShare || 0;
            });

            document.getElementById('kpiActiveRentals').textContent = activeCount;
            document.getElementById('kpiOverdue').textContent = overdueCount;
            document.getElementById('kpiTotalRevenue').textContent = `₱${totalRevenue.toLocaleString()}`;
            document.getElementById('kpiOurShare').textContent = `₱${ourShare.toLocaleString()}`;
            document.getElementById('kpiLessorPayoutSub').textContent = `₱${lessorPayout.toLocaleString()} payout to lessors`;
        }

        function updateStatus(rentalId, newStatus) {
            const rental = rentalsData.find(r => r.id === rentalId);
            if (rental) {
                rental.status = newStatus;
                saveState();
                updateKPIs();
                filterTable();
                renderInventoryGrid();
                renderLessorsGrid();
                showToast(`Rental status updated to ${newStatus}`, "info");
            }
        }

        function updatePaymentStatus(rentalId, newStatus) {
            const rental = rentalsData.find(r => r.id === rentalId);
            if (rental) {
                rental.paymentStatus = newStatus;
                saveState();
                filterTable();
                showToast(`Payment status updated to ${newStatus}`, "success");
            }
        }

        function deleteRental(rentalId) {
            rentalsData = rentalsData.filter(r => r.id !== rentalId);
            saveState();
            updateKPIs();
            filterTable();
            renderInventoryGrid();
            renderLessorsGrid();
            showToast("Rental record deleted.", "info");
        }

        function filterTable() {
            const searchVal = (document.getElementById('searchInput')?.value || '').toLowerCase();
            const statusVal = document.getElementById('statusFilter')?.value || 'ALL';
            const paymentVal = document.getElementById('paymentFilter')?.value || 'ALL';

            const filtered = rentalsData.filter(r => {
                const matchesSearch = (r.customer || '').toLowerCase().includes(searchVal) || 
                                      (r.items || '').toLowerCase().includes(searchVal) || 
                                      (r.notes || '').toLowerCase().includes(searchVal) ||
                                      (r.lessorName || '').toLowerCase().includes(searchVal);
                const matchesStatus = statusVal === 'ALL' || r.status === statusVal;
                const matchesPayment = paymentVal === 'ALL' || r.paymentStatus === paymentVal;
                return matchesSearch && matchesStatus && matchesPayment;
            });

            renderRentalsTable(filtered);
        }

        function renderRentalsTable(data) {
            const tbody = document.getElementById('rentalsTableBody');
            const emptyState = document.getElementById('emptyTableState');

            if (!tbody) return;
            tbody.innerHTML = '';

            if (data.length === 0) {
                if (emptyState) emptyState.classList.remove('hidden');
                return;
            } else {
                if (emptyState) emptyState.classList.add('hidden');
            }

            data.forEach(r => {
                const tr = document.createElement('tr');
                tr.className = 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800';

                let lessorBadgeClass = "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700";
                if (r.lessorType === "Partner Business") lessorBadgeClass = "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60";
                else if (r.lessorType === "Individual Lessor") lessorBadgeClass = "bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/60";

                const paymentBadge = r.paymentStatus === 'Paid' 
                    ? `<button onclick="updatePaymentStatus(${r.id}, 'Unpaid')" class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 cursor-pointer">Paid</button>`
                    : `<button onclick="updatePaymentStatus(${r.id}, 'Paid')" class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 cursor-pointer">Unpaid</button>`;

                const notesDisplay = r.notes ? `<span class="block text-[11px] text-slate-400 dark:text-slate-400 italic mt-0.5"><i data-lucide="notebook" class="w-3 h-3 inline mr-1"></i>${r.notes}</span>` : '';

                tr.innerHTML = `
                    <td class="py-3.5 px-4 sm:px-5 font-bold text-slate-900 dark:text-white">
                        <div>${r.customer || '-'}</div>
                        ${notesDisplay}
                    </td>
                    <td class="py-3.5 px-4 sm:px-5 font-medium text-slate-700 dark:text-slate-300">${r.items || '-'}</td>
                    <td class="py-3.5 px-4 sm:px-5">
                        <span class="inline-block px-2 py-0.5 text-[10px] font-bold rounded-lg border ${lessorBadgeClass}">
                            ${r.lessorName || 'In-House'}
                        </span>
                    </td>
                    <td class="py-3.5 px-4 sm:px-5 font-medium text-slate-600 dark:text-slate-400">${r.deposit || '-'}</td>
                    <td class="py-3.5 px-4 sm:px-5 font-bold text-slate-900 dark:text-white">₱${(r.totalCustomerPrice || 0).toLocaleString()}</td>
                    <td class="py-3.5 px-4 sm:px-5 font-bold text-teal-600 dark:text-teal-400">₱${(r.totalOurShare || 0).toLocaleString()}</td>
                    <td class="py-3.5 px-4 sm:px-5">${paymentBadge}</td>
                    <td class="py-3.5 px-4 sm:px-5">
                        <select onchange="updateStatus(${r.id}, this.value)" class="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 font-semibold focus:outline-none focus:border-teal-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                            <option value="Active" ${r.status === 'Active' ? 'selected' : ''}>Active</option>
                            <option value="Overdue" ${r.status === 'Overdue' ? 'selected' : ''}>Overdue</option>
                            <option value="Returned" ${r.status === 'Returned' ? 'selected' : ''}>Returned</option>
                            <option value="Damaged" ${r.status === 'Damaged' ? 'selected' : ''}>Damaged</option>
                        </select>
                    </td>
                    <td class="py-3.5 px-4 sm:px-5 text-right space-x-1 whitespace-nowrap">
                        <button onclick="openAddGearModal(${r.id})" class="px-2.5 py-1 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900 text-teal-700 dark:text-teal-300 font-bold rounded-lg text-[11px] border border-teal-200 dark:border-teal-800/60 transition cursor-pointer" title="Add More Gear">
                            + Gear
                        </button>
                        <button onclick="deleteRental(${r.id})" class="px-2 py-1 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-400 rounded-lg text-[11px] border border-rose-200 dark:border-rose-800/60 transition cursor-pointer" title="Delete Record">
                            <i data-lucide="trash-2" class="w-3.5 h-3.5 inline"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            if (window.lucide) lucide.createIcons();
        }

        function renderInventoryGrid() {
            const container = document.getElementById('inventoryGrid');
            if (!container) return;

            const activeOut = { "Mask": 0, "Short Fins": 0, "Long Fins": 0, "Lifevest": 0, "GoPro": 0, "Floater": 0 };
            rentalsData.forEach(r => {
                if (r.status === 'Active' || r.status === 'Overdue') {
                    if (r.itemQuantities) {
                        Object.keys(activeOut).forEach(k => {
                            activeOut[k] += r.itemQuantities[k] || 0;
                        });
                    }
                }
            });

            container.innerHTML = '';
            gearStockDirectory.forEach(item => {
                const outCount = activeOut[item.code] || 0;
                const available = Math.max(0, item.totalStock - outCount);

                const card = document.createElement('div');
                card.className = 'bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3';
                card.innerHTML = `
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-3">
                            <div class="p-2.5 bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 rounded-xl">
                                <i data-lucide="${item.icon}" class="w-5 h-5"></i>
                            </div>
                            <div>
                                <h4 class="font-bold text-slate-900 dark:text-white text-sm">${item.name}</h4>
                                <span class="text-[11px] text-slate-400">Total Registered: ${item.totalStock}</span>
                            </div>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                        <div class="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl text-center">
                            <span class="text-[10px] text-slate-400 uppercase font-bold block">Currently Rented</span>
                            <span class="text-base font-extrabold text-amber-600 dark:text-amber-400">${outCount}</span>
                        </div>
                        <div class="bg-teal-50 dark:bg-teal-950/50 p-2.5 rounded-xl text-center">
                            <span class="text-[10px] text-teal-700 dark:text-teal-400 uppercase font-bold block">In Stock</span>
                            <span class="text-base font-extrabold text-teal-700 dark:text-teal-400">${available}</span>
                        </div>
                    </div>
                `;
                container.appendChild(card);
            });

            if (window.lucide) lucide.createIcons();
        }

        function renderLessorsGrid() {
            const container = document.getElementById('lessorsGrid');
            if (!container) return;

            container.innerHTML = '';
            lessorsDirectory.forEach(lessor => {
                const activeCount = rentalsData.filter(r => (r.status === 'Active' || r.status === 'Overdue') && r.lessorName === lessor.name).length;

                const isPartner = lessor.type === 'Partner Business';
                const typeBadge = isPartner 
                    ? `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">Partner Business</span>`
                    : `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60">Individual Lessor</span>`;

                const card = document.createElement('div');
                card.className = 'bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3';
                card.innerHTML = `
                    <div>
                        <div class="flex items-start justify-between">
                            <div>
                                <h4 class="font-bold text-slate-900 dark:text-white text-sm">${lessor.name}</h4>
                                <p class="text-xs text-slate-400 mt-0.5">${lessor.location || 'Station'}</p>
                            </div>
                            ${typeBadge}
                        </div>
                        <div class="mt-3 space-y-1 text-xs text-slate-600 dark:text-slate-300">
                            <p class="flex items-center space-x-1.5">
                                <i data-lucide="phone" class="w-3.5 h-3.5 text-slate-400"></i>
                                <span>${lessor.phone || 'N/A'}</span>
                            </p>
                            <p class="flex items-center space-x-1.5">
                                <i data-lucide="file-text" class="w-3.5 h-3.5 text-slate-400"></i>
                                <span>${lessor.commission || 'Standard Split'}</span>
                            </p>
                        </div>
                    </div>
                    <div class="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                        <span class="text-slate-500 dark:text-slate-400 font-medium">${activeCount} Active Rental(s)</span>
                        <div class="flex items-center space-x-1">
                            <button onclick="openEditLessorModal(${lessor.id})" class="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition cursor-pointer" title="Edit Lessor">
                                <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                            </button>
                            <button onclick="deleteLessor(${lessor.id})" class="p-1.5 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-400 rounded-lg transition cursor-pointer" title="Delete Lessor">
                                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                            </button>
                        </div>
                    </div>
                `;
                container.appendChild(card);
            });

            if (window.lucide) lucide.createIcons();
        }

        // PDF Export Handler
        function exportToPDF() {
            if (!window.jspdf) {
                showToast("PDF generator loading, please try again in a moment.", "warning");
                return;
            }

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

            doc.setFont("helvetica", "bold");
            doc.setFontSize(16);
            doc.setTextColor(15, 23, 42);
            doc.text("AquaTrack - Snorkeling Gear Rental Report", 14, 16);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.setTextColor(100, 116, 139);
            doc.text(`Generated on: ${new Date().toLocaleString()}  |  Total Records: ${rentalsData.length}`, 14, 23);

            let totalRev = 0, totalOur = 0, totalLessor = 0;
            rentalsData.forEach(r => {
                totalRev += r.totalCustomerPrice || 0;
                totalOur += r.totalOurShare || 0;
                totalLessor += r.totalLessorShare || 0;
            });

            doc.setFillColor(241, 245, 249);
            doc.roundedRect(14, 26, 269, 12, 2, 2, 'F');
            doc.setFont("helvetica", "bold");
            doc.setFontSize(9);
            doc.setTextColor(13, 148, 136);
            doc.text(`TOTAL REVENUE: PHP ${totalRev.toLocaleString()}    |    OUR SHARE: PHP ${totalOur.toLocaleString()}    |    LESSOR PAYOUT: PHP ${totalLessor.toLocaleString()}`, 18, 33.5);

            const tableData = rentalsData.map(r => [
                r.customer || '-',
                r.items || '-',
                r.lessorName || 'In-House',
                r.deposit || '-',
                `PHP ${(r.totalCustomerPrice || 0).toLocaleString()}`,
                `PHP ${(r.totalOurShare || 0).toLocaleString()}`,
                r.paymentStatus || 'Unpaid',
                r.status || 'Active',
                r.notes || '-'
            ]);

            doc.autoTable({
                startY: 42,
                head: [['Customer Name', 'Rented Items', 'Lessor Source', 'Deposit Held', 'Total Bill', 'Our Share', 'Payment', 'Status', 'Notes']],
                body: tableData,
                theme: 'striped',
                headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
                bodyStyles: { fontSize: 8, cellPadding: 2.5 },
                alternateRowStyles: { fillColor: [248, 250, 252] }
            });

            doc.save(`AquaTrack_Rental_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
            showToast("PDF Report exported successfully!", "success");
        }

        // Initial Load Event Hook
        window.onload = function() {
            loadSavedState();
            if (window.lucide) lucide.createIcons();
            populatePartnerDropdown();
            updateKPIs();
            filterTable();
            renderInventoryGrid();
            renderLessorsGrid();
        };
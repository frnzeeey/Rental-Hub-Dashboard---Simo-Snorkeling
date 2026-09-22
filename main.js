        // GEAR PRICING & COMMISSION RULES (in PHP)
        const GEAR_PRICING_RULES = {
            "Mask":        { price: 100, ourShare: 50,  lessorShare: 50 },
            "Short Fins":  { price: 150, ourShare: 50,  lessorShare: 100 },
            "Long Fins":   { price: 300, ourShare: 150, lessorShare: 150 },
            "Lifevest":    { price: 100, ourShare: 50,  lessorShare: 50 },
            "GoPro":       { price: 700, ourShare: 400, lessorShare: 300 },
            "Floater":     { price: 100, ourShare: 50,  lessorShare: 50 }
        };

        // TOTAL GEAR STOCK DIRECTORY
        const gearStockDirectory = [
            { name: "Snorkel Mask", code: "Mask", icon: "glasses", totalStock: 35 },
            { name: "Short Fins", code: "Short Fins", icon: "footprints", totalStock: 25 },
            { name: "Long Fins", code: "Long Fins", icon: "waves", totalStock: 20 },
            { name: "Lifevest", code: "Lifevest", icon: "life-buoy", totalStock: 40 },
            { name: "GoPro Camera", code: "GoPro", icon: "camera", totalStock: 10 },
            { name: "Floater", code: "Floater", icon: "disc", totalStock: 15 }
        ];

        // DEFAULT LESSORS DIRECTORY
        const defaultLessorsDirectory = [
            { id: 1, name: "Coral Bay Watersports", type: "Partner Business", location: "Main Beach Station 1", phone: "0917-123-4567", commission: "Standard Split" },
            { id: 2, name: "Oceanic Gear Station", type: "Partner Business", location: "South Cove Docks", phone: "0918-987-6543", commission: "Standard Split" },
            { id: 3, name: "Capt. Mark (Island Guide)", type: "Individual Lessor", location: "Freelance Harbor", phone: "0920-555-0199", commission: "Standard Split" }
        ];

        let lessorsDirectory = [];
        let rentalsData = [];
        let currentAddGearRentalId = null;

        function loadSavedState() {
            try {
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
                console.warn("Storage error, starting with default state:", e);
                rentalsData = [];
                lessorsDirectory = [...defaultLessorsDirectory];
            }
        }

        function saveState() {
            try {
                localStorage.setItem('aquatrack_rentals', JSON.stringify(rentalsData));
                localStorage.setItem('aquatrack_lessors', JSON.stringify(lessorsDirectory));
            } catch (e) {
                console.warn("Storage save error:", e);
            }
        }

        function exportToPDF() {
            if (!window.jspdf) {
                showToast("PDF generator loading, please try again in a moment.", "warning");
                return;
            }

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

            // Title Header
            doc.setFont("helvetica", "bold");
            doc.setFontSize(16);
            doc.setTextColor(15, 23, 42);
            doc.text("AquaTrack - Snorkeling Gear Rental Report", 14, 16);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.setTextColor(100, 116, 139);
            doc.text(`Generated on: ${new Date().toLocaleString()}  |  Total Records: ${rentalsData.length}`, 14, 23);

            // Summary Totals Banner
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

            // Transaction Table
            const tableData = rentalsData.map(r => [
                r.customer || '-',
                r.items || '-',
                r.lessorName || 'In-House',
                r.deposit || '-',
                `PHP ${(r.totalCustomerPrice || 0).toLocaleString()}`,
                `PHP ${(r.totalOurShare || 0).toLocaleString()}`,
                r.paymentStatus || 'Unpaid',
                r.status || 'Active',
                r.dueTime || '-'
            ]);

            doc.autoTable({
                startY: 42,
                head: [['Customer Name', 'Rented Items', 'Lessor Source', 'Deposit Held', 'Total Bill', 'Our Share', 'Payment', 'Status', 'Due Time']],
                body: tableData,
                theme: 'striped',
                headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
                bodyStyles: { fontSize: 8, cellPadding: 2.5 },
                alternateRowStyles: { fillColor: [248, 250, 252] }
            });

            doc.save(`AquaTrack_Rental_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
            showToast("PDF Report exported successfully!", "success");
        }

        function showToast(message, type = "warning") {
            const container = document.getElementById("toastContainer");
            if (!container) return;

            const toast = document.createElement("div");
            toast.className = `toast-animate pointer-events-auto px-4 py-3 rounded-xl shadow-xl text-xs font-bold text-white flex items-center space-x-2 ${
                type === "error" || type === "warning" ? "bg-amber-600" : "bg-teal-600"
            }`;
            toast.innerHTML = `
                <i data-lucide="${type === "error" || type === "warning" ? "alert-circle" : "check-circle"}" class="w-4 h-4"></i>
                <span>${message}</span>
            `;
            container.appendChild(toast);
            if (window.lucide) lucide.createIcons();

            setTimeout(() => {
                toast.classList.add("opacity-0", "transition-opacity", "duration-300");
                setTimeout(() => toast.remove(), 300);
            }, 3500);
        }

        function switchTab(tabName) {
            const views = ['dashboard', 'inventory', 'lessors'];
            views.forEach(v => {
                const el = document.getElementById(`view-${v}`);
                const nav = document.getElementById(`nav-${v}`);
                if (el) el.classList.add('hidden');
                if (nav) {
                    nav.classList.remove('bg-teal-500/10', 'text-teal-400', 'font-semibold', 'border', 'border-teal-500/20');
                    nav.classList.add('hover:bg-slate-800', 'text-slate-400', 'hover:text-white');
                }
            });

            const activeView = document.getElementById(`view-${tabName}`);
            const activeNav = document.getElementById(`nav-${tabName}`);
            if (activeView) activeView.classList.remove('hidden');
            if (activeNav) {
                activeNav.classList.remove('hover:bg-slate-800', 'text-slate-400', 'hover:text-white');
                activeNav.classList.add('bg-teal-500/10', 'text-teal-400', 'font-semibold', 'border', 'border-teal-500/20');
            }

            const titles = {
                'dashboard': 'Rental Dashboard',
                'inventory': 'Gear Inventory Management',
                'lessors': 'Third-Party & Freelance Lessors Directory'
            };
            const titleEl = document.getElementById('pageTitle');
            if (titleEl && titles[tabName]) titleEl.textContent = titles[tabName];
        }

        function openRentalModal() {
            const modal = document.getElementById('rentalModal');
            if (modal) modal.classList.remove('hidden');
            populatePartnerDropdown();
            toggleLessorFields();
            updatePreview();
        }

        function closeRentalModal() {
            const modal = document.getElementById('rentalModal');
            if (modal) modal.classList.add('hidden');
        }

        function openAddGearModal(id) {
            currentAddGearRentalId = id;
            const record = rentalsData.find(r => r.id === id);
            if (!record) return;

            const modal = document.getElementById('addGearModal');
            const subtitle = document.getElementById('addGearCustomerSubtitle');
            const itemsDisplay = document.getElementById('currentRentedItemsDisplay');

            if (subtitle) subtitle.textContent = `Adding gear for guest: ${record.customer}`;
            if (itemsDisplay) itemsDisplay.textContent = record.items || 'None';

            Object.keys(GEAR_PRICING_RULES).forEach(name => {
                const chk = document.getElementById(`addChk-${name}`);
                const qty = document.getElementById(`addQty-${name}`);
                if (chk) chk.checked = false;
                if (qty) qty.value = 0;
            });

            if (modal) modal.classList.remove('hidden');
            updateAddGearPreview();
        }

        function closeAddGearModal() {
            const modal = document.getElementById('addGearModal');
            if (modal) modal.classList.add('hidden');
            currentAddGearRentalId = null;
        }

        function openLessorModal() {
            const modal = document.getElementById('addLessorModal');
            if (modal) modal.classList.remove('hidden');
        }

        function closeLessorModal() {
            const modal = document.getElementById('addLessorModal');
            if (modal) modal.classList.add('hidden');
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

            const modal = document.getElementById('editLessorModal');
            if (modal) modal.classList.remove('hidden');
        }

        function closeEditLessorModal() {
            const modal = document.getElementById('editLessorModal');
            if (modal) modal.classList.add('hidden');
        }

        function populatePartnerDropdown() {
            const partnerSelect = document.getElementById('partnerLessorSelect');
            if (!partnerSelect) return;

            partnerSelect.innerHTML = '';
            const partnerLessors = lessorsDirectory.filter(l => l.type === 'Partner Business');

            if (partnerLessors.length === 0) {
                const opt = document.createElement('option');
                opt.value = "";
                opt.textContent = "No Partner Businesses Registered (Add one in Directory)";
                partnerSelect.appendChild(opt);
                return;
            }

            partnerLessors.forEach(l => {
                const option = document.createElement('option');
                option.value = l.name;
                option.textContent = `${l.name} (${l.location || 'Partner'})`;
                partnerSelect.appendChild(option);
            });
        }

        function toggleLessorFields() {
            const partnerRadio = document.querySelector('input[name="lessorTypeRadio"][value="Partner Business"]');
            const customRadio = document.querySelector('input[name="lessorTypeRadio"][value="Individual Lessor"]');

            const partnerContainer = document.getElementById('partnerLessorContainer');
            const customContainer = document.getElementById('customLessorContainer');

            if (partnerContainer) partnerContainer.classList.toggle('hidden', !partnerRadio?.checked);
            if (customContainer) customContainer.classList.toggle('hidden', !customRadio?.checked);

            if (partnerRadio?.checked) {
                populatePartnerDropdown();
            }
            updatePreview();
        }

        function handleCheckboxChange(gearName) {
            const chk = document.getElementById(`chk-${gearName}`);
            const qtyInput = document.getElementById(`qty-${gearName}`);
            if (chk && qtyInput) {
                if (chk.checked && parseInt(qtyInput.value) === 0) {
                    qtyInput.value = 1;
                } else if (!chk.checked) {
                    qtyInput.value = 0;
                }
            }
            updatePreview();
        }

        function handleQuantityInput(gearName) {
            const chk = document.getElementById(`chk-${gearName}`);
            const qtyInput = document.getElementById(`qty-${gearName}`);
            if (chk && qtyInput) {
                const val = parseInt(qtyInput.value) || 0;
                chk.checked = val > 0;
            }
            updatePreview();
        }

        function handleAddGearCheckboxChange(gearName) {
            const chk = document.getElementById(`addChk-${gearName}`);
            const qtyInput = document.getElementById(`addQty-${gearName}`);
            if (chk && qtyInput) {
                if (chk.checked && parseInt(qtyInput.value) === 0) {
                    qtyInput.value = 1;
                } else if (!chk.checked) {
                    qtyInput.value = 0;
                }
            }
            updateAddGearPreview();
        }

        function handleAddGearQuantityInput(gearName) {
            const chk = document.getElementById(`addChk-${gearName}`);
            const qtyInput = document.getElementById(`addQty-${gearName}`);
            if (chk && qtyInput) {
                const val = parseInt(qtyInput.value) || 0;
                chk.checked = val > 0;
            }
            updateAddGearPreview();
        }

        function resetRentalFormQuantities() {
            Object.keys(GEAR_PRICING_RULES).forEach(name => {
                const chk = document.getElementById(`chk-${name}`);
                const qty = document.getElementById(`qty-${name}`);
                if (chk) chk.checked = false;
                if (qty) qty.value = 0;
            });
            updatePreview();
        }

        function computeTransaction(itemQuantities, lessorType) {
            let totalCustomerPrice = 0;

            Object.keys(GEAR_PRICING_RULES).forEach(key => {
                const q = itemQuantities[key] || 0;
                totalCustomerPrice += q * GEAR_PRICING_RULES[key].price;
            });

            const M = itemQuantities["Mask"] || 0;
            const V = itemQuantities["Lifevest"] || 0;
            const SF = itemQuantities["Short Fins"] || 0;
            const LF = itemQuantities["Long Fins"] || 0;
            const GP = itemQuantities["GoPro"] || 0;
            const FL = itemQuantities["Floater"] || 0;

            // Set bundle rule: Any combination of 3 items from Mask, Lifevest, Short Fins
            const totalBundleGearCount = M + V + SF;
            const totalSets = Math.floor(totalBundleGearCount / 3);
            const remBundleItems = totalBundleGearCount % 3;

            let totalOurShare = 0;
            let totalLessorShare = 0;

            if (lessorType === "In-House") {
                totalOurShare = totalCustomerPrice;
                totalLessorShare = 0;
            } else {
                totalOurShare += totalSets * 100;

                let remM = M, remV = V, remSF = SF;
                const deductItem = (type, share) => {
                    if (type === "Mask" && remM > 0) { remM--; totalOurShare += share; return true; }
                    if (type === "Vest" && remV > 0) { remV--; totalOurShare += share; return true; }
                    if (type === "SF" && remSF > 0) { remSF--; totalOurShare += share; return true; }
                    return false;
                };

                for (let i = 0; i < remBundleItems; i++) {
                    if (!deductItem("Mask", 50)) {
                        if (!deductItem("Vest", 50)) {
                            deductItem("SF", 50);
                        }
                    }
                }

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

        function updatePreview() {
            const itemQuantities = {};
            Object.keys(GEAR_PRICING_RULES).forEach(name => {
                const qtyInput = document.getElementById(`qty-${name}`);
                itemQuantities[name] = qtyInput ? parseInt(qtyInput.value) || 0 : 0;
            });

            const lessorTypeRadio = document.querySelector('input[name="lessorTypeRadio"]:checked');
            const lessorType = lessorTypeRadio ? lessorTypeRadio.value : 'In-House';

            const breakdown = computeTransaction(itemQuantities, lessorType);

            const prevPrice = document.getElementById('previewTotalPrice');
            const prevOur = document.getElementById('previewOurShare');
            const prevLessor = document.getElementById('previewLessorShare');
            const setBanner = document.getElementById('setDiscountBanner');
            const setText = document.getElementById('setTextBanner');

            if (prevPrice) prevPrice.textContent = `₱${breakdown.totalCustomerPrice.toLocaleString()}`;
            if (prevOur) prevOur.textContent = `₱${breakdown.totalOurShare.toLocaleString()}`;
            if (prevLessor) prevLessor.textContent = `₱${breakdown.totalLessorShare.toLocaleString()}`;

            if (setBanner) {
                if (breakdown.totalSets > 0 && lessorType !== "In-House") {
                    setBanner.classList.remove('hidden');
                    if (setText) setText.textContent = `${breakdown.totalSets} Set(s) Active! (₱100 Our Share per 3-gear combo applied)`;
                } else {
                    setBanner.classList.add('hidden');
                }
            }
        }

        function updateAddGearPreview() {
            if (!currentAddGearRentalId) return;
            const record = rentalsData.find(r => r.id === currentAddGearRentalId);
            if (!record) return;

            const addedQuantities = {};
            let totalAddedPrice = 0;

            Object.keys(GEAR_PRICING_RULES).forEach(name => {
                const qtyInput = document.getElementById(`addQty-${name}`);
                const addQty = qtyInput ? parseInt(qtyInput.value) || 0 : 0;
                addedQuantities[name] = addQty;
                totalAddedPrice += addQty * GEAR_PRICING_RULES[name].price;
            });

            const combinedQuantities = {};
            Object.keys(GEAR_PRICING_RULES).forEach(name => {
                combinedQuantities[name] = (record.itemQuantities?.[name] || 0) + (addedQuantities[name] || 0);
            });

            const newBreakdown = computeTransaction(combinedQuantities, record.lessorType);

            const curEl = document.getElementById('addGearCurrentTotal');
            const addEl = document.getElementById('addGearAddedTotal');
            const newEl = document.getElementById('addGearNewTotal');

            if (curEl) curEl.textContent = `₱${(record.totalCustomerPrice || 0).toLocaleString()}`;
            if (addEl) addEl.textContent = `+₱${totalAddedPrice.toLocaleString()}`;
            if (newEl) newEl.textContent = `₱${newBreakdown.totalCustomerPrice.toLocaleString()}`;
        }

        function handleRentalSubmit(event) {
            event.preventDefault();

            const customer = document.getElementById('customerName').value.trim();
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
                const notes = document.getElementById('customLessorNotes').value.trim();

                if (!lessorsDirectory.some(l => l.name.toLowerCase() === customName.toLowerCase())) {
                    lessorsDirectory.push({
                        id: Date.now(),
                        name: customName,
                        type: "Individual Lessor",
                        location: "Freelance / Local",
                        phone: phone || "N/A",
                        commission: notes || "Standard Split"
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
            if (pricingBreakdown.remMask > 0) formattedParts.push(`Mask x${pricingBreakdown.remMask}`);
            if (pricingBreakdown.remVest > 0) formattedParts.push(`Lifevest x${pricingBreakdown.remVest}`);
            if (pricingBreakdown.remShortFins > 0) formattedParts.push(`Short Fins x${pricingBreakdown.remShortFins}`);
            if (pricingBreakdown.remLongFins > 0) formattedParts.push(`Long Fins x${pricingBreakdown.remLongFins}`);
            if (pricingBreakdown.goProQty > 0) formattedParts.push(`GoPro x${pricingBreakdown.goProQty}`);
            if (pricingBreakdown.floaterQty > 0) formattedParts.push(`Floater x${pricingBreakdown.floaterQty}`);

            const newRecord = {
                id: Date.now(),
                customer: customer,
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

        function handleAddGearSubmit(event) {
            event.preventDefault();
            if (!currentAddGearRentalId) return;

            const record = rentalsData.find(r => r.id === currentAddGearRentalId);
            if (!record) return;

            if (!record.itemQuantities) {
                record.itemQuantities = { "Mask": 0, "Short Fins": 0, "Long Fins": 0, "Lifevest": 0, "GoPro": 0, "Floater": 0 };
            }

            let totalAddedCount = 0;
            Object.keys(GEAR_PRICING_RULES).forEach(name => {
                const qtyInput = document.getElementById(`addQty-${name}`);
                const addQty = qtyInput ? parseInt(qtyInput.value) || 0 : 0;
                if (addQty > 0) {
                    record.itemQuantities[name] = (record.itemQuantities[name] || 0) + addQty;
                    totalAddedCount += addQty;
                }
            });

            if (totalAddedCount === 0) {
                showToast("Please enter a quantity for at least one additional gear item.", "warning");
                return;
            }

            const pricingBreakdown = computeTransaction(record.itemQuantities, record.lessorType);

            const formattedParts = [];
            if (pricingBreakdown.totalSets > 0) formattedParts.push(`Gear Set x${pricingBreakdown.totalSets}`);
            if (pricingBreakdown.remMask > 0) formattedParts.push(`Mask x${pricingBreakdown.remMask}`);
            if (pricingBreakdown.remVest > 0) formattedParts.push(`Lifevest x${pricingBreakdown.remVest}`);
            if (pricingBreakdown.remShortFins > 0) formattedParts.push(`Short Fins x${pricingBreakdown.remShortFins}`);
            if (pricingBreakdown.remLongFins > 0) formattedParts.push(`Long Fins x${pricingBreakdown.remLongFins}`);
            if (pricingBreakdown.goProQty > 0) formattedParts.push(`GoPro x${pricingBreakdown.goProQty}`);
            if (pricingBreakdown.floaterQty > 0) formattedParts.push(`Floater x${pricingBreakdown.floaterQty}`);

            record.items = formattedParts.join(', ');
            record.totalCustomerPrice = pricingBreakdown.totalCustomerPrice;
            record.totalOurShare = pricingBreakdown.totalOurShare;
            record.totalLessorShare = pricingBreakdown.totalLessorShare;

            saveState();
            updateKPIs();
            filterTable();
            renderInventoryGrid();
            renderLessorsGrid();
            closeAddGearModal();
            showToast("Additional gear appended to order!", "success");
        }

        function handleNewLessorSubmit(event) {
            event.preventDefault();
            const name = document.getElementById('newLessorName').value.trim();
            const type = document.getElementById('newLessorType').value;
            const location = document.getElementById('newLessorLocation').value.trim() || 'General Beach Area';
            const phone = document.getElementById('newLessorPhone').value.trim() || 'N/A';
            const commission = document.getElementById('newLessorCommission').value.trim() || 'Standard Split';

            if (!name) return;

            lessorsDirectory.push({
                id: Date.now(),
                name,
                type,
                location,
                phone,
                commission
            });

            saveState();
            renderLessorsGrid();
            populatePartnerDropdown();
            closeLessorModal();
            showToast("New lessor registered!", "success");
        }

        function handleEditLessorSubmit(event) {
            event.preventDefault();
            const id = parseInt(document.getElementById('editLessorId').value);
            const lessor = lessorsDirectory.find(l => l.id === id);
            if (!lessor) return;

            const oldName = lessor.name;
            const newName = document.getElementById('editLessorName').value.trim();
            const newType = document.getElementById('editLessorType').value;
            const newLocation = document.getElementById('editLessorLocation').value.trim() || 'General Beach Area';
            const newPhone = document.getElementById('editLessorPhone').value.trim() || 'N/A';
            const newCommission = document.getElementById('editLessorCommission').value.trim() || 'Standard Split';

            if (!newName) return;

            lessor.name = newName;
            lessor.type = newType;
            lessor.location = newLocation;
            lessor.phone = newPhone;
            lessor.commission = newCommission;

            rentalsData.forEach(r => {
                if (r.lessorName === oldName) {
                    r.lessorName = newName;
                    r.lessorType = newType;
                }
            });

            saveState();
            renderLessorsGrid();
            populatePartnerDropdown();
            filterTable();
            closeEditLessorModal();
            showToast("Lessor details updated successfully!", "success");
        }

        function updateStatus(id, newStatus) {
            const item = rentalsData.find(r => r.id === id);
            if (item) {
                item.status = newStatus;
                saveState();
                updateKPIs();
                renderInventoryGrid();
                filterTable();
            }
        }

        function updatePaymentStatus(id, newStatus) {
            const item = rentalsData.find(r => r.id === id);
            if (item) {
                item.paymentStatus = newStatus;
                saveState();
                updateKPIs();
                filterTable();
            }
        }

        function deleteRental(id) {
            rentalsData = rentalsData.filter(r => r.id !== id);
            saveState();
            updateKPIs();
            renderInventoryGrid();
            filterTable();
            showToast("Rental record removed.", "info");
        }

        function deleteLessor(id) {
            const lessor = lessorsDirectory.find(l => l.id === id);
            if (!lessor) return;

            const activeRentalsCount = rentalsData.filter(r => r.lessorName === lessor.name).length;
            if (activeRentalsCount > 0) {
                showToast(`Cannot delete ${lessor.name}: active in ${activeRentalsCount} rental transaction(s).`, "warning");
                return;
            }

            lessorsDirectory = lessorsDirectory.filter(l => l.id !== id);
            saveState();
            renderLessorsGrid();
            populatePartnerDropdown();
            showToast(`Lessor "${lessor.name}" removed from directory.`, "info");
        }

        function updateKPIs() {
            let activeRentalsCount = 0;
            let overdueCount = 0;
            let totalRevenue = 0;
            let totalOurShare = 0;
            let totalLessorShare = 0;

            rentalsData.forEach(r => {
                if (r.status === 'Active') activeRentalsCount++;
                if (r.status === 'Overdue') overdueCount++;
                totalRevenue += r.totalCustomerPrice || 0;
                totalOurShare += r.totalOurShare || 0;
                totalLessorShare += r.totalLessorShare || 0;
            });

            const kpiActive = document.getElementById('kpiActiveRentals');
            const kpiOverdue = document.getElementById('kpiOverdue');
            const kpiRevenue = document.getElementById('kpiTotalRevenue');
            const kpiOur = document.getElementById('kpiOurShare');
            const kpiLessorSub = document.getElementById('kpiLessorPayoutSub');

            if (kpiActive) kpiActive.textContent = activeRentalsCount;
            if (kpiOverdue) kpiOverdue.textContent = overdueCount;
            if (kpiRevenue) kpiRevenue.textContent = `₱${totalRevenue.toLocaleString()}`;
            if (kpiOur) kpiOur.textContent = `₱${totalOurShare.toLocaleString()}`;
            if (kpiLessorSub) kpiLessorSub.textContent = `₱${totalLessorShare.toLocaleString()} payout to lessors`;
        }

        function filterTable() {
            const searchVal = (document.getElementById('searchInput')?.value || '').toLowerCase();
            const statusVal = document.getElementById('statusFilter')?.value || 'ALL';
            const paymentVal = document.getElementById('paymentFilter')?.value || 'ALL';

            const filtered = rentalsData.filter(r => {
                const matchesSearch = (r.customer || '').toLowerCase().includes(searchVal) || 
                                      (r.items || '').toLowerCase().includes(searchVal) || 
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
                tr.className = 'hover:bg-slate-50/80 transition-colors border-b border-slate-100';

                let lessorBadgeClass = "bg-slate-100 text-slate-700 border-slate-200";
                if (r.lessorType === "Partner Business") lessorBadgeClass = "bg-purple-50 text-purple-700 border-purple-200";
                else if (r.lessorType === "Individual Lessor") lessorBadgeClass = "bg-sky-50 text-sky-700 border-sky-200";

                const paymentBadge = r.paymentStatus === 'Paid' 
                    ? `<button onclick="updatePaymentStatus(${r.id}, 'Unpaid')" class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 cursor-pointer">Paid</button>`
                    : `<button onclick="updatePaymentStatus(${r.id}, 'Paid')" class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 hover:bg-amber-200 cursor-pointer">Unpaid</button>`;

                tr.innerHTML = `
                    <td class="py-3.5 px-5 font-bold text-slate-900">${r.customer || '-'}</td>
                    <td class="py-3.5 px-5 font-medium text-slate-700">${r.items || '-'}</td>
                    <td class="py-3.5 px-5">
                        <span class="inline-block px-2.5 py-1 text-[10px] font-bold rounded-lg border ${lessorBadgeClass}">
                            ${r.lessorName || 'In-House'}
                        </span>
                    </td>
                    <td class="py-3.5 px-5 font-medium text-slate-600">${r.deposit || '-'}</td>
                    <td class="py-3.5 px-5 font-bold text-slate-900">₱${(r.totalCustomerPrice || 0).toLocaleString()}</td>
                    <td class="py-3.5 px-5 font-bold text-teal-600">₱${(r.totalOurShare || 0).toLocaleString()}</td>
                    <td class="py-3.5 px-5">${paymentBadge}</td>
                    <td class="py-3.5 px-5">
                        <select onchange="updateStatus(${r.id}, this.value)" class="text-xs border border-slate-200 rounded-lg px-2 py-1 font-semibold focus:outline-none focus:border-teal-500 bg-white">
                            <option value="Active" ${r.status === 'Active' ? 'selected' : ''}>Active</option>
                            <option value="Overdue" ${r.status === 'Overdue' ? 'selected' : ''}>Overdue</option>
                            <option value="Returned" ${r.status === 'Returned' ? 'selected' : ''}>Returned</option>
                            <option value="Damaged" ${r.status === 'Damaged' ? 'selected' : ''}>Damaged</option>
                        </select>
                    </td>
                    <td class="py-3.5 px-5 text-right space-x-1">
                        <button onclick="openAddGearModal(${r.id})" class="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold rounded-lg text-[11px] transition cursor-pointer" title="Add More Gear">
                            + Gear
                        </button>
                        <button onclick="deleteRental(${r.id})" class="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-[11px] transition cursor-pointer" title="Delete Record">
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
                card.className = 'bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3';
                card.innerHTML = `
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-3">
                            <div class="p-2.5 bg-teal-50 text-teal-600 rounded-xl">
                                <i data-lucide="${item.icon}" class="w-5 h-5"></i>
                            </div>
                            <div>
                                <h4 class="font-bold text-slate-900 text-sm">${item.name}</h4>
                                <span class="text-[11px] text-slate-400">Total Registered: ${item.totalStock}</span>
                            </div>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                        <div class="bg-slate-50 p-2.5 rounded-xl text-center">
                            <span class="text-[10px] text-slate-400 uppercase font-bold block">Currently Rented</span>
                            <span class="text-base font-extrabold text-amber-600">${outCount}</span>
                        </div>
                        <div class="bg-teal-50 p-2.5 rounded-xl text-center">
                            <span class="text-[10px] text-teal-700 uppercase font-bold block">In Stock</span>
                            <span class="text-base font-extrabold text-teal-700">${available}</span>
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
                    ? `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">Partner Business</span>`
                    : `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">Individual Lessor</span>`;

                const card = document.createElement('div');
                card.className = 'bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3';
                card.innerHTML = `
                    <div>
                        <div class="flex items-start justify-between">
                            <div>
                                <h4 class="font-bold text-slate-900 text-sm">${lessor.name}</h4>
                                <p class="text-xs text-slate-400 mt-0.5">${lessor.location || 'Station'}</p>
                            </div>
                            ${typeBadge}
                        </div>
                        <div class="mt-3 space-y-1 text-xs text-slate-600">
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
                    <div class="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span class="text-slate-500 font-medium">${activeCount} Active Rental(s)</span>
                        <div class="flex items-center space-x-1">
                            <button onclick="openEditLessorModal(${lessor.id})" class="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer" title="Edit Lessor">
                                <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                            </button>
                            <button onclick="deleteLessor(${lessor.id})" class="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition cursor-pointer" title="Delete Lessor">
                                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                            </button>
                        </div>
                    </div>
                `;
                container.appendChild(card);
            });

            if (window.lucide) lucide.createIcons();
        }

        window.onload = function() {
            loadSavedState();
            if (window.lucide) lucide.createIcons();
            populatePartnerDropdown();
            updateKPIs();
            filterTable();
            renderInventoryGrid();
            renderLessorsGrid();
        };
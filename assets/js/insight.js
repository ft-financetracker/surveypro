  (() => {
    'use strict';

    const insightState = {
      mounted: false,
      loading: false,
      data: null,
      resizeTimer: null
    };

    const insightColors = [
      '#1E3A8A',
      '#B6FF00',
      '#2563EB',
      '#0B132B',
      '#94A3B8',
      '#16A34A',
      '#D97706',
      '#DC2626'
    ];

    window.FTSPInsight = {
      mount:
        mountFTSPInsight,

      reload:
        loadFTSPInsight_
    };

    window.addEventListener(
      'resize',
      () => {
        window.clearTimeout(
          insightState.resizeTimer
        );

        insightState.resizeTimer =
          window.setTimeout(
            () => {
              if (
                insightState.data
              ) {
                drawFTSPInsightCharts_(
                  insightState.data
                );
              }
            },
            180
          );
      }
    );

    function mountFTSPInsight() {
      const page =
        document.querySelector(
          '[data-page="insight"]'
        );

      if (!page) {
        return;
      }

      if (
        !insightState.mounted
      ) {
        page.innerHTML =
          buildFTSPInsightLayout_();

        bindFTSPInsightEvents_();

        insightState.mounted =
          true;
      }

      loadFTSPInsight_();
    }

    function buildFTSPInsightLayout_() {
      return `
        <section
          class="ftsp-insight"
          id="ftspInsightRoot"
        >
          <div class="ftsp-insight-hero">
            <div class="ftsp-insight-hero__copy">
              <span>
                Executive Analytics
              </span>

              <h2>
                Peta biaya pondok dalam satu tampilan.
              </h2>

              <p>
                Gunakan statistik, komposisi biaya,
                ranking, dan tingkat verifikasi untuk
                membaca posisi tarif secara lebih objektif.
              </p>
            </div>

            <div
              class="ftsp-insight-hero__icon"
              aria-hidden="true"
            >
              <span class="material-symbols-rounded">
                monitoring
              </span>
            </div>
          </div>

          <div class="ftsp-insight-toolbar">
            <div class="ftsp-insight-field">
              <label for="insightTahunAjaran">
                Tahun Ajaran
              </label>

              <select id="insightTahunAjaran">
                <option value="">
                  Semua tahun ajaran
                </option>
              </select>
            </div>

            <div class="ftsp-insight-field">
              <label for="insightProvinsi">
                Provinsi
              </label>

              <select id="insightProvinsi">
                <option value="">
                  Semua provinsi
                </option>
              </select>
            </div>

            <div class="ftsp-insight-field">
              <label for="insightWilayah">
                Wilayah
              </label>

              <select id="insightWilayah">
                <option value="">
                  Semua wilayah
                </option>
              </select>
            </div>

            <div class="ftsp-insight-check">
              <label>
                <input
                  type="checkbox"
                  id="insightVerifiedOnly"
                >

                Hanya terverifikasi
              </label>
            </div>
          </div>

          <div
            class="ftsp-insight-summary"
            id="insightSummary"
          ></div>

          <div class="ftsp-insight-charts">
            <section class="ftsp-insight-panel">
              <div class="ftsp-insight-panel__head">
                <div>
                  <p>
                    Komparasi
                  </p>

                  <h3>
                    Rata-rata Biaya per Wilayah
                  </h3>
                </div>

                <span>
                  Estimasi tahun pertama
                </span>
              </div>

              <div class="ftsp-insight-chart-area">
                <canvas
                  id="insightBarChart"
                  aria-label="Grafik rata-rata biaya per wilayah"
                ></canvas>
              </div>
            </section>

            <section class="ftsp-insight-panel">
              <div class="ftsp-insight-panel__head">
                <div>
                  <p>
                    Kualitas Data
                  </p>

                  <h3>
                    Status Verifikasi
                  </h3>
                </div>
              </div>

              <div class="ftsp-insight-donut-layout">
                <div class="ftsp-insight-donut-wrap">
                  <canvas
                    id="insightDonutChart"
                    aria-label="Diagram status verifikasi"
                  ></canvas>

                  <div class="ftsp-insight-donut-center">
                    <strong id="insightDonutTotal">
                      0
                    </strong>

                    <span>
                      Survey
                    </span>
                  </div>
                </div>

                <div
                  class="ftsp-insight-legend"
                  id="insightDonutLegend"
                ></div>
              </div>
            </section>
          </div>

          <div class="ftsp-insight-charts">
            <section class="ftsp-insight-panel">
              <div class="ftsp-insight-panel__head">
                <div>
                  <p>
                    Struktur Tarif
                  </p>

                  <h3>
                    Komposisi Biaya Tahun Pertama
                  </h3>
                </div>
              </div>

              <div class="ftsp-insight-chart-area">
                <canvas
                  id="insightCompositionChart"
                  aria-label="Grafik komposisi biaya tahun pertama"
                ></canvas>
              </div>
            </section>

            <section class="ftsp-insight-panel">
              <div class="ftsp-insight-panel__head">
                <div>
                  <p>
                    Interpretasi
                  </p>

                  <h3>
                    Ringkasan Analisis
                  </h3>
                </div>
              </div>

              <div
                class="ftsp-insight-analysis"
                id="insightNarrative"
              ></div>
            </section>
          </div>

          <div class="ftsp-insight-grid">
            <section class="ftsp-insight-panel">
              <div class="ftsp-insight-panel__head">
                <div>
                  <p>
                    Ranking
                  </p>

                  <h3>
                    Biaya Tahun Pertama
                  </h3>
                </div>

                <span id="insightRecordCount">
                  0 survey
                </span>
              </div>

              <div
                class="ftsp-insight-table-wrap"
                id="insightRanking"
              ></div>
            </section>

            <section class="ftsp-insight-panel">
              <div class="ftsp-insight-panel__head">
                <div>
                  <p>
                    Wilayah
                  </p>

                  <h3>
                    Perbandingan Area
                  </h3>
                </div>
              </div>

              <div
                class="ftsp-insight-group"
                id="insightByRegion"
              ></div>
            </section>
          </div>
        </section>
      `;
    }

    function bindFTSPInsightEvents_() {
      [
        'insightTahunAjaran',
        'insightProvinsi',
        'insightWilayah',
        'insightVerifiedOnly'
      ].forEach(id => {
        document
          .getElementById(id)
          ?.addEventListener(
            'change',
            loadFTSPInsight_
          );
      });
    }

    function loadFTSPInsight_() {
      if (
        insightState.loading
      ) {
        return;
      }

      insightState.loading =
        true;

      setFTSPInsightLoading_(true);

      google.script.run
        .withSuccessHandler(
          response => {
            insightState.loading =
              false;

            setFTSPInsightLoading_(false);

            if (
              !response ||
              response.success !== true
            ) {
              renderFTSPInsightError_(
                response?.message ||
                'Insight gagal dimuat.'
              );

              return;
            }

            insightState.data =
              response;

            fillFTSPInsightOptions_(
              response.options || {}
            );

            renderFTSPInsight_(
              response
            );
          }
        )
        .withFailureHandler(
          error => {
            insightState.loading =
              false;

            setFTSPInsightLoading_(false);

            renderFTSPInsightError_(
              error?.message ||
              'Insight gagal dimuat.'
            );
          }
        )
        .ftspGetInsightData(
          getFTSPInsightFilters_()
        );
    }

    function getFTSPInsightFilters_() {
      return {
        tahunAjaran:
          document
            .getElementById(
              'insightTahunAjaran'
            )
            ?.value || '',

        provinsi:
          document
            .getElementById(
              'insightProvinsi'
            )
            ?.value || '',

        wilayah:
          document
            .getElementById(
              'insightWilayah'
            )
            ?.value || '',

        verifiedOnly:
          Boolean(
            document
              .getElementById(
                'insightVerifiedOnly'
              )
              ?.checked
          )
      };
    }

    function fillFTSPInsightOptions_(
      options
    ) {
      fillFTSPSelect_(
        'insightTahunAjaran',
        options.tahunAjaran || [],
        'Semua tahun ajaran'
      );

      fillFTSPSelect_(
        'insightProvinsi',
        options.provinsi || [],
        'Semua provinsi'
      );

      fillFTSPSelect_(
        'insightWilayah',
        options.wilayah || [],
        'Semua wilayah'
      );
    }

    function fillFTSPSelect_(
      id,
      values,
      placeholder
    ) {
      const select =
        document.getElementById(id);

      if (!select) {
        return;
      }

      const current =
        select.value;

      select.innerHTML = [
        `<option value="">${escapeFTSPHtml_(placeholder)}</option>`,

        ...values.map(value => {
          return `
            <option value="${escapeFTSPHtml_(value)}">
              ${escapeFTSPHtml_(value)}
            </option>
          `;
        })
      ].join('');

      if (
        values.includes(current)
      ) {
        select.value =
          current;
      }
    }

    function renderFTSPInsight_(
      response
    ) {
      const summary =
        response.summary || {};

      renderFTSPInsightSummary_(
        summary
      );

      const count =
        document.getElementById(
          'insightRecordCount'
        );

      if (count) {
        count.textContent =
          `${Number(response.totalRecords || 0)} survey`;
      }

      renderFTSPRanking_(
        response.ranking || []
      );

      renderFTSPInsightGroups_(
        'insightByRegion',
        response.byRegion || []
      );

      renderFTSPNarrative_(
        response.narrativePoints || []
      );

      renderFTSPDonutLegend_(
        response.statusDistribution || []
      );

      const donutTotal =
        document.getElementById(
          'insightDonutTotal'
        );

      if (donutTotal) {
        donutTotal.textContent =
          String(
            response.totalRecords || 0
          );
      }

      drawFTSPInsightCharts_(
        response
      );
    }

    function renderFTSPInsightSummary_(
      summary
    ) {
      const target =
        document.getElementById(
          'insightSummary'
        );

      if (!target) {
        return;
      }

      target.innerHTML = [
        buildFTSPInsightCard_(
          'Rata-rata PSB',
          formatFTSPCurrency_(
            summary.averagePSB
          ),
          'account_balance',
          `Median ${formatFTSPCurrency_(summary.medianPSB)}`
        ),

        buildFTSPInsightCard_(
          'Rata-rata SPP',
          formatFTSPCurrency_(
            summary.averageSPP
          ),
          'calendar_month',
          `Median ${formatFTSPCurrency_(summary.medianSPP)}`
        ),

        buildFTSPInsightCard_(
          'Tahun Pertama',
          formatFTSPCurrency_(
            summary.averageFirstYear
          ),
          'payments',
          `Median ${formatFTSPCurrency_(summary.medianFirstYear)}`
        ),

        buildFTSPInsightCard_(
          'Tingkat Verifikasi',
          formatFTSPPercent_(
            summary.verificationRate
          ),
          'verified',
          `${Number(summary.verifiedCount || 0)} data terverifikasi`
        )
      ].join('');
    }

    function buildFTSPInsightCard_(
      label,
      value,
      icon,
      helper
    ) {
      return `
        <article class="ftsp-insight-card">
          <div class="ftsp-insight-card__head">
            <span>
              ${escapeFTSPHtml_(label)}
            </span>

            <span class="ftsp-insight-card__icon">
              <span
                class="material-symbols-rounded"
                aria-hidden="true"
              >
                ${escapeFTSPHtml_(icon)}
              </span>
            </span>
          </div>

          <strong>
            ${escapeFTSPHtml_(value)}
          </strong>

          <small>
            ${escapeFTSPHtml_(helper)}
          </small>
        </article>
      `;
    }

    function renderFTSPRanking_(
      rows
    ) {
      const target =
        document.getElementById(
          'insightRanking'
        );

      if (!target) {
        return;
      }

      if (!rows.length) {
        target.innerHTML =
          buildFTSPEmpty_(
            'Tidak ada data sesuai filter.'
          );

        return;
      }

      target.innerHTML = `
        <table class="ftsp-insight-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Pondok</th>
              <th>PSB</th>
              <th>SPP</th>
              <th>Tahun Pertama</th>
            </tr>
          </thead>

          <tbody>
            ${rows.map(
              (item, index) => {
                return `
                  <tr>
                    <td>
                      <span class="ftsp-insight-rank ${
                        index === 0
                          ? 'is-top'
                          : ''
                      }">
                        ${index + 1}
                      </span>
                    </td>

                    <td>
                      <strong>
                        ${escapeFTSPHtml_(item.namaPondok)}
                      </strong>
                    </td>

                    <td>
                      ${escapeFTSPHtml_(formatFTSPCurrency_(item.biayaPSB))}
                    </td>

                    <td>
                      ${escapeFTSPHtml_(formatFTSPCurrency_(item.sppBulanan))}
                    </td>

                    <td>
                      <strong>
                        ${escapeFTSPHtml_(formatFTSPCurrency_(item.estimasiTahunPertama))}
                      </strong>
                    </td>
                  </tr>
                `;
              }
            ).join('')}
          </tbody>
        </table>
      `;
    }

    function renderFTSPInsightGroups_(
      id,
      rows
    ) {
      const target =
        document.getElementById(id);

      if (!target) {
        return;
      }

      if (!rows.length) {
        target.innerHTML =
          buildFTSPEmpty_(
            'Belum ada data wilayah.'
          );

        return;
      }

      target.innerHTML =
        rows.slice(0, 8).map(item => {
          return `
            <article class="ftsp-insight-group-item">
              <div>
                <strong>
                  ${escapeFTSPHtml_(item.label)}
                </strong>

                <span>
                  ${Number(item.totalSurvey || 0)} survey
                </span>
              </div>

              <b>
                ${escapeFTSPHtml_(formatFTSPCurrency_(item.averageFirstYear))}
              </b>
            </article>
          `;
        }).join('');
    }

    function renderFTSPNarrative_(
      rows
    ) {
      const target =
        document.getElementById(
          'insightNarrative'
        );

      if (!target) {
        return;
      }

      if (!rows.length) {
        target.innerHTML =
          buildFTSPEmpty_(
            'Belum ada analisis.'
          );

        return;
      }

      target.innerHTML =
        rows.map(item => {
          return `
            <article class="ftsp-insight-analysis-item">
              <span class="ftsp-insight-analysis-item__icon">
                <span
                  class="material-symbols-rounded"
                  aria-hidden="true"
                >
                  ${escapeFTSPHtml_(item.icon || 'insights')}
                </span>
              </span>

              <div>
                <h4>
                  ${escapeFTSPHtml_(item.title || 'Analisis')}
                </h4>

                <p>
                  ${emphasizeFTSPText_(
                    item.text || '',
                    item.emphasis || ''
                  )}
                </p>
              </div>
            </article>
          `;
        }).join('');
    }

    function renderFTSPDonutLegend_(
      rows
    ) {
      const target =
        document.getElementById(
          'insightDonutLegend'
        );

      if (!target) {
        return;
      }

      if (!rows.length) {
        target.innerHTML =
          buildFTSPEmpty_(
            'Belum ada status.'
          );

        return;
      }

      const total =
        rows.reduce(
          (sum, item) =>
            sum + Number(item.value || 0),
          0
        );

      target.innerHTML =
        rows.map((item, index) => {
          const percentage =
            total
              ? (
                  Number(item.value || 0) /
                  total
                ) * 100
              : 0;

          return `
            <div class="ftsp-insight-legend-item">
              <i style="background:${insightColors[index % insightColors.length]}"></i>

              <span>
                ${escapeFTSPHtml_(item.label)}
              </span>

              <strong>
                ${formatFTSPPercent_(percentage)}
              </strong>
            </div>
          `;
        }).join('');
    }

    function drawFTSPInsightCharts_(
      response
    ) {
      window.requestAnimationFrame(
        () => {
          drawFTSPBarChart_(
            'insightBarChart',
            (response.byRegion || [])
              .slice(0, 7)
              .map(item => ({
                label:
                  item.label,

                value:
                  item.averageFirstYear
              }))
          );

          drawFTSPDonutChart_(
            'insightDonutChart',
            response.statusDistribution || []
          );

          drawFTSPBarChart_(
            'insightCompositionChart',
            response.costComposition || [],
            {
              horizontal:
                true
            }
          );
        }
      );
    }

    function drawFTSPBarChart_(
      canvasId,
      rows,
      options = {}
    ) {
      const canvas =
        document.getElementById(
          canvasId
        );

      if (!canvas) {
        return;
      }

      const parent =
        canvas.parentElement;

      const width =
        Math.max(
          parent.clientWidth,
          280
        );

      const height =
        290;

      const ratio =
        window.devicePixelRatio || 1;

      canvas.width =
        width * ratio;

      canvas.height =
        height * ratio;

      canvas.style.width =
        `${width}px`;

      canvas.style.height =
        `${height}px`;

      const ctx =
        canvas.getContext('2d');

      ctx.setTransform(
        ratio,
        0,
        0,
        ratio,
        0,
        0
      );

      ctx.clearRect(
        0,
        0,
        width,
        height
      );

      if (!rows.length) {
        drawFTSPEmptyCanvas_(
          ctx,
          width,
          height
        );

        return;
      }

      if (
        options.horizontal
      ) {
        drawFTSPHorizontalBars_(
          ctx,
          width,
          height,
          rows
        );

        return;
      }

      const padding = {
        top: 18,
        right: 14,
        bottom: 54,
        left: 54
      };

      const chartWidth =
        width -
        padding.left -
        padding.right;

      const chartHeight =
        height -
        padding.top -
        padding.bottom;

      const maximum =
        Math.max(
          ...rows.map(
            item =>
              Number(item.value || 0)
          ),
          1
        );

      ctx.strokeStyle =
        '#E2E8F0';

      ctx.lineWidth =
        1;

      for (
        let step = 0;
        step <= 4;
        step++
      ) {
        const y =
          padding.top +
          (
            chartHeight /
            4
          ) * step;

        ctx.beginPath();
        ctx.moveTo(
          padding.left,
          y
        );
        ctx.lineTo(
          width -
          padding.right,
          y
        );
        ctx.stroke();

        const axisValue =
          maximum *
          (
            1 -
            step / 4
          );

        ctx.fillStyle =
          '#94A3B8';

        ctx.font =
          '10px Inter, sans-serif';

        ctx.textAlign =
          'right';

        ctx.fillText(
          compactFTSPCurrency_(
            axisValue
          ),
          padding.left - 8,
          y + 3
        );
      }

      const slot =
        chartWidth /
        rows.length;

      const barWidth =
        Math.min(
          48,
          slot * .58
        );

      rows.forEach(
        (item, index) => {
          const value =
            Number(item.value || 0);

          const barHeight =
            (
              value /
              maximum
            ) *
            chartHeight;

          const x =
            padding.left +
            slot * index +
            (
              slot -
              barWidth
            ) / 2;

          const y =
            padding.top +
            chartHeight -
            barHeight;

          const gradient =
            ctx.createLinearGradient(
              0,
              y,
              0,
              padding.top +
              chartHeight
            );

          gradient.addColorStop(
            0,
            '#1E3A8A'
          );

          gradient.addColorStop(
            1,
            '#2563EB'
          );

          drawFTSPRoundedRect_(
            ctx,
            x,
            y,
            barWidth,
            barHeight,
            8,
            gradient
          );

          ctx.fillStyle =
            '#334155';

          ctx.font =
            '10px Inter, sans-serif';

          ctx.textAlign =
            'center';

          ctx.fillText(
            truncateFTSPLabel_(
              item.label,
              11
            ),
            x +
            barWidth / 2,
            height - 24
          );

          ctx.fillStyle =
            '#0B132B';

          ctx.font =
            '700 9px Inter, sans-serif';

          ctx.fillText(
            compactFTSPCurrency_(
              value
            ),
            x +
            barWidth / 2,
            Math.max(
              y - 7,
              10
            )
          );
        }
      );
    }

    function drawFTSPHorizontalBars_(
      ctx,
      width,
      height,
      rows
    ) {
      const padding = {
        top: 20,
        right: 72,
        bottom: 18,
        left: 92
      };

      const chartWidth =
        width -
        padding.left -
        padding.right;

      const chartHeight =
        height -
        padding.top -
        padding.bottom;

      const maximum =
        Math.max(
          ...rows.map(
            item =>
              Number(item.value || 0)
          ),
          1
        );

      const slot =
        chartHeight /
        rows.length;

      const barHeight =
        Math.min(
          32,
          slot * .5
        );

      rows.forEach(
        (item, index) => {
          const value =
            Number(item.value || 0);

          const y =
            padding.top +
            slot * index +
            (
              slot -
              barHeight
            ) / 2;

          const currentWidth =
            (
              value /
              maximum
            ) *
            chartWidth;

          ctx.fillStyle =
            '#F1F5F9';

          drawFTSPRoundedRect_(
            ctx,
            padding.left,
            y,
            chartWidth,
            barHeight,
            8,
            '#F1F5F9'
          );

          drawFTSPRoundedRect_(
            ctx,
            padding.left,
            y,
            currentWidth,
            barHeight,
            8,
            insightColors[
              index %
              insightColors.length
            ]
          );

          ctx.fillStyle =
            '#334155';

          ctx.font =
            '10px Inter, sans-serif';

          ctx.textAlign =
            'right';

          ctx.fillText(
            truncateFTSPLabel_(
              item.label,
              13
            ),
            padding.left - 10,
            y +
            barHeight / 2 +
            3
          );

          ctx.fillStyle =
            '#0B132B';

          ctx.font =
            '700 10px Inter, sans-serif';

          ctx.textAlign =
            'left';

          ctx.fillText(
            compactFTSPCurrency_(
              value
            ),
            padding.left +
            currentWidth +
            8,
            y +
            barHeight / 2 +
            3
          );
        }
      );
    }

    function drawFTSPDonutChart_(
      canvasId,
      rows
    ) {
      const canvas =
        document.getElementById(
          canvasId
        );

      if (!canvas) {
        return;
      }

      const size =
        Math.max(
          canvas.parentElement.clientWidth,
          170
        );

      const ratio =
        window.devicePixelRatio || 1;

      canvas.width =
        size * ratio;

      canvas.height =
        size * ratio;

      canvas.style.width =
        `${size}px`;

      canvas.style.height =
        `${size}px`;

      const ctx =
        canvas.getContext('2d');

      ctx.setTransform(
        ratio,
        0,
        0,
        ratio,
        0,
        0
      );

      ctx.clearRect(
        0,
        0,
        size,
        size
      );

      const total =
        rows.reduce(
          (sum, item) =>
            sum + Number(item.value || 0),
          0
        );

      const center =
        size / 2;

      const radius =
        size * .36;

      const lineWidth =
        size * .12;

      if (!total) {
        ctx.strokeStyle =
          '#E2E8F0';

        ctx.lineWidth =
          lineWidth;

        ctx.beginPath();
        ctx.arc(
          center,
          center,
          radius,
          0,
          Math.PI * 2
        );
        ctx.stroke();

        return;
      }

      let startAngle =
        -Math.PI / 2;

      rows.forEach(
        (item, index) => {
          const share =
            Number(item.value || 0) /
            total;

          const endAngle =
            startAngle +
            share *
            Math.PI *
            2;

          ctx.strokeStyle =
            insightColors[
              index %
              insightColors.length
            ];

          ctx.lineWidth =
            lineWidth;

          ctx.lineCap =
            'butt';

          ctx.beginPath();
          ctx.arc(
            center,
            center,
            radius,
            startAngle,
            endAngle
          );
          ctx.stroke();

          startAngle =
            endAngle;
        }
      );
    }

    function drawFTSPRoundedRect_(
      ctx,
      x,
      y,
      width,
      height,
      radius,
      fillStyle
    ) {
      const safeRadius =
        Math.min(
          radius,
          width / 2,
          height / 2
        );

      ctx.beginPath();
      ctx.roundRect(
        x,
        y,
        Math.max(width, 0),
        Math.max(height, 0),
        safeRadius
      );
      ctx.fillStyle =
        fillStyle;
      ctx.fill();
    }

    function drawFTSPEmptyCanvas_(
      ctx,
      width,
      height
    ) {
      ctx.fillStyle =
        '#94A3B8';

      ctx.font =
        '11px Inter, sans-serif';

      ctx.textAlign =
        'center';

      ctx.fillText(
        'Belum ada data untuk ditampilkan.',
        width / 2,
        height / 2
      );
    }

    function setFTSPInsightLoading_(
      loading
    ) {
      document
        .getElementById(
          'ftspInsightRoot'
        )
        ?.classList.toggle(
          'ftsp-insight-loading',
          Boolean(loading)
        );
    }

    function renderFTSPInsightError_(
      message
    ) {
      const target =
        document.getElementById(
          'insightNarrative'
        );

      if (target) {
        target.innerHTML = `
          <div class="ftsp-insight-empty">
            ${escapeFTSPHtml_(message)}
          </div>
        `;
      }
    }

    function buildFTSPEmpty_(
      message
    ) {
      return `
        <div class="ftsp-insight-empty">
          ${escapeFTSPHtml_(message)}
        </div>
      `;
    }

    function emphasizeFTSPText_(
      text,
      emphasis
    ) {
      const safeText =
        escapeFTSPHtml_(text);

      const safeEmphasis =
        escapeFTSPHtml_(emphasis);

      if (!safeEmphasis) {
        return safeText;
      }

      return safeText.replace(
        safeEmphasis,
        `<strong>${safeEmphasis}</strong>`
      );
    }

    function formatFTSPCurrency_(
      value
    ) {
      return new Intl.NumberFormat(
        'id-ID',
        {
          style:
            'currency',

          currency:
            'IDR',

          maximumFractionDigits:
            0
        }
      ).format(
        Number(value || 0)
      );
    }

    function compactFTSPCurrency_(
      value
    ) {
      const number =
        Number(value || 0);

      if (
        Math.abs(number) >=
        1000000000
      ) {
        return `Rp${(
          number /
          1000000000
        ).toFixed(1)}M`;
      }

      if (
        Math.abs(number) >=
        1000000
      ) {
        return `Rp${(
          number /
          1000000
        ).toFixed(1)}jt`;
      }

      if (
        Math.abs(number) >=
        1000
      ) {
        return `Rp${Math.round(
          number /
          1000
        )}rb`;
      }

      return `Rp${Math.round(number)}`;
    }

    function formatFTSPPercent_(
      value
    ) {
      return new Intl.NumberFormat(
        'id-ID',
        {
          style:
            'percent',

          maximumFractionDigits:
            0
        }
      ).format(
        Number(value || 0) /
        100
      );
    }

    function truncateFTSPLabel_(
      value,
      maxLength
    ) {
      const text =
        String(value || '');

      return text.length >
        maxLength
          ? `${text.slice(
              0,
              maxLength - 1
            )}…`
          : text;
    }

    function escapeFTSPHtml_(
      value
    ) {
      return String(
        value ?? ''
      )
        .replace(
          /&/g,
          '&amp;'
        )
        .replace(
          /</g,
          '&lt;'
        )
        .replace(
          />/g,
          '&gt;'
        )
        .replace(
          /"/g,
          '&quot;'
        )
        .replace(
          /'/g,
          '&#039;'
        );
    }

    window.setTimeout(
      () => {
        const route =
          window.location.hash
            .replace('#', '')
            .trim();

        if (route === 'insight') {
          mountFTSPInsight();
        }
      },
      0
    );
  })();

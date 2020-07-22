const $ = require('jquery');
const electron = require('electron').remote;
const dialog = electron.dialog;
let fsp = require('fs').promises;

$(document).ready(function () {
    let rows = [];
    function getDefaultCell() {
        let cell = {
            val: '',
            fontFamily: 'Georiga',
            fontSize: '10',
            bold: false,
            italic: false,
            underline: false,
            bgColor: '#FFFFFF',
            color: '#000000',
            halign: 'left',
            formula: '',
            upstream: [],
            downstream: []
        }
        return cell;
    }

    function prepareCellDiv(cdiv, cobj) {
        $(cdiv).html(cobj.val);
        $(cdiv).css('font-family', cobj.fontFamily);
        $(cdiv).css('font-size', cobj.fontSize + 'px');
        $(cdiv).css('font-weight', cobj.bold ? 'bold' : 'normal');
        $(cdiv).css('font-style', cobj.italic ? 'italic' : 'normal');
        $(cdiv).css('text-decoration', cobj.underline ? 'underline' : 'none');
        $(cdiv).css('background-color', cobj.bgColor);
        $(cdiv).css('color', cobj.color);
        $(cdiv).css('text-align', cobj.halign);
    }

    $('#content_container').on('scroll', function () {
        $('#first-row').css('top', $('#content_container').scrollTop());
        $('#first-col').css('left', $('#content_container').scrollLeft());
        $('#tl-cell').css('left', $('#content_container').scrollLeft());
        $('#tl-cell').css('top', $('#content_container').scrollTop());
    });

    $('#menu_bar > div').on('click', function () {
        $('#menu_bar > div').removeClass('selected');
        $(this).addClass('selected');
        let menuContainerId = $(this).attr('data-content');
        $('#menu_content_container > div').css('display', 'none');
        $('#' + menuContainerId).css('display', 'flex');
    })

    $('#new').on('click', function () {
        rows = [];
        $('#grid').find('.row').each(function () {
            let cells = []
            $(this).find('.cell').each(function () {
                let cell = getDefaultCell();
                cells.push(cell);
                prepareCellDiv(this, cell);
            })
            rows.push(cells);
        })

        $('#home-menu').click();
        $('#grid .cell:first').click();
    })

    $('#open').on('click', async function () {
        let sdb = await dialog.showOpenDialog();
        let data = await fsp.readFile(sdb.filePaths[0])
        rows = JSON.parse(data);

        let x = 0;
        $('#grid').find('.row').each(function () {
            let y = 0;
            $(this).find('.cell').each(function () {
                let cell = rows[x][y];
                prepareCellDiv(this, cell);
                y++;
            })
            x++;
        })
        $('#home-menu').click();
        $('#grid .cell:first').click();
    })

    $('#save').on('click', async function () {
        let sdb = await dialog.showSaveDialog();
        await fsp.writeFile(sdb.filePath, JSON.stringify(rows)) ;
        alert('saved');
    })

    $('#bold').on('click', function () {
        $(this).toggleClass('selected');

        let bold = $(this).hasClass('selected');
        $('#grid .cell.selected').each(function() {
            $(this).css('font-weight', bold ? 'bold' : 'normal');
            let rid = parseInt($(this).attr('rid'));
            let cid = parseInt($(this).attr('cid'));
            let cobj = rows[rid][cid];
            cobj.bold = bold;
        })
    })

    $('#italic').on('click', function () {
        $(this).toggleClass('selected');

        let italic = $(this).hasClass('selected');
        $('#grid .cell.selected').each(function() {
            $(this).css('font-style', italic ? 'italic' : 'normal');
            let rid = parseInt($(this).attr('rid'));
            let cid = parseInt($(this).attr('cid'));
            let cobj = rows[rid][cid];
            cobj.italic = italic;
        })
    })

    $('#underline').on('click', function () {
        $(this).toggleClass('selected');

        let underline = $(this).hasClass('selected');
        $('#grid .cell.selected').each(function() {
            $(this).css('text-decoration', underline ? 'underline' : 'none');
            let rid = parseInt($(this).attr('rid'));
            let cid = parseInt($(this).attr('cid'));
            let cobj = rows[rid][cid];
            cobj.underline = underline;
        })
    })

    $('.valgin').on('click', function () {
        $('.valgin').removeClass('selected');
        $(this).addClass('selected');
    })

    $('.halign').on('click', function () {
        $('.halign').removeClass('selected');
        $(this).addClass('selected');

        let halgin = $(this).attr('prop-val');
        $('#grid .cell.selected').each(function() {
            $(this).css('text-align', halgin);
            let rid = parseInt($(this).attr('rid'));
            let cid = parseInt($(this).attr('cid'));
            let cobj = rows[rid][cid];
            cobj.halign = halgin;
        })
    })

    $('#grid .cell').on('click', function (e) {
        if (e.ctrlKey) {
            $(this).addClass('selected');
        }
        else {
            $('#grid .cell').removeClass('selected');
            $(this).addClass('selected');
        }

        let rid = parseInt($(this).attr('rid'));
        let cid = parseInt($(this).attr('cid'));
        let cobj = rows[rid][cid];

        $('#font-family').val(cobj.fontFamily);
        $('#font-size').val(cobj.fontSize);

        if(cobj.bold) {
            $('#bold').addClass('selected');
        } else {
            $('#bold').removeClass('selected');
        }

        if(cobj.italic) {
            $('#italic').addClass('selected');
        } else {
            $('#italic').removeClass('selected');
        }

        if(cobj.underline) {
            $('#underline').addClass('selected');
        } else {
            $('#underline').removeClass('selected');
        }

        $('#bg-color').val(cobj.bgColor);
        $('#text-color').val(cobj.color);
        $('.halign').removeClass('selected');
        $('.halign[prop-val=' + cobj.halign + ']').addClass('selected');

        $('#cellFormula').val(String.fromCharCode('A'.charCodeAt(0) + cid) + (rid + 1));
        $('#txtFormula').val(cobj.formula);
    })

    $('#grid .cell').on('keyup', function (e) {
        let rid = parseInt($(this).attr('rid'));
        let cid = parseInt($(this).attr('cid'));
        let cobj = rows[rid][cid];
        

        if(cobj.formula) {
            $('#txtFormula').val('');
            deleteFormula(rid, cid);
        }
        
        updateVal(rid, cid, $(this).html(), false);
    })

    function updateVal(rid, cid, val, render) {
        let cobj = rows[rid][cid];
        cobj.val = val;
        if(render) {
            $('.cell[rid=' + rid + '][cid=' + cid + ']').html(val);
        }

        for(let i = 0; i < cobj.downstream.length; i++) {
            let dso = cobj.downstream[i];
            let fdso = rows[dso.rid][dso.cid];
            let mval = evaluateFormula(fdso);
            updateVal(dso.rid, dso.cid, mval, true);
        }
    }

    function deleteFormula(rid, cid) {
        let cobj = rows[rid][cid];
        cobj.formula = '';

        // delete  formula and update upstream
        for(let i = 0; i < cobj.upstream.length; i++) {
            let uso = cobj.upstream[i];
            let fuso = rows[uso.rid][uso.cid];
            for(let j = 0; j < fuso.downstream.length; j++) {
                let dso = fuso.downstream[j];
                if(dso.rid == rid && dso.cid == cid) {
                    fuso.downstream.splice(j, 1);
                    break;
                }
            }
        }
        cobj.upstream = [];
    }

    function evaluateFormula(cobj) {
        let formula = cobj.formula;
        for(let i = 0; i < cobj.upstream.length; i++) {
            let uso = cobj.upstream[i];
            let fuso = rows[uso.rid][uso.cid];
            let cellName = String.fromCharCode('A'.charCodeAt(0) + uso.cid) + (uso.rid + 1);
            formula = formula.replace(cellName, fuso.val || 0);
        }

        let nval = eval(formula);
        return nval;
    }

    $('#txtFormula').on('blur', function() {
        let formula = $(this).val();

        $('#grid .cell.selected').each(function() {
            let rid = parseInt($(this).attr('rid'));
            let cid = parseInt($(this).attr('cid'));
            let cobj = rows[rid][cid];

            if(cobj.formula) {
                deleteFormula(rid, cid);
            }

            setUpFormula(rid, cid, formula)
            let nval = evaluateFormula(cobj);
            updateVal(rid, cid, nval, true);
        })
    })

    function setUpFormula(rid, cid, formula) {
        let cobj = rows[rid][cid];
        cobj.formula = formula;

        formula = formula.replace('(', '').replace(')', '');
        let conps = formula.split(' ');
        for(let i = 0; i < conps.length; i++) {
            if(conps[i].charCodeAt(0) >= "A".charCodeAt(0) && conps[i].charCodeAt(0) <= "Z".charCodeAt(0)) {
                let urid = parseInt(conps[i].substr(1)) - 1;
                let ucid = conps[i].charCodeAt(0) - "A".charCodeAt(0);
                cobj.upstream.push({
                    rid: urid,
                    cid: ucid
                })

                let fuso = rows[urid][ucid];
                fuso.downstream.push({
                    rid: rid,
                    cid: cid
                })
            }
        }
    }

    $('#font-family').on('change', function() {
        let fontFamily = $(this).val();
        $('#grid .cell.selected').each(function() {
            $(this).css('font-family', fontFamily);
            let rid = parseInt($(this).attr('rid'));
            let cid = parseInt($(this).attr('cid'));
            let cobj = rows[rid][cid];
            cobj.fontFamily = fontFamily;
        })
    })

    $('#font-size').on('change', function() {
        let fontSize = $(this).val();
        $('#grid .cell.selected').each(function() {
            $(this).css('font-size', fontSize);
            let rid = parseInt($(this).attr('rid'));
            let cid = parseInt($(this).attr('cid'));
            let cobj = rows[rid][cid];
            cobj.fontSize = fontSize;
        })
    })

    $('#text-color').on('change', function() {
        let color = $(this).val();
        $('#grid .cell.selected').each(function() {
            $(this).css('color', color);
            let rid = parseInt($(this).attr('rid'));
            let cid = parseInt($(this).attr('cid'));
            let cobj = rows[rid][cid];
            cobj.color = color;
        })
    })

    $('#bg-color').on('change', function() {
        let color = $(this).val();
        $('#grid .cell.selected').each(function() {
            $(this).css('background-color', color);
            let rid = parseInt($(this).attr('rid'));
            let cid = parseInt($(this).attr('cid'));
            let cobj = rows[rid][cid];
            cobj.bgColor = color;
        })
    })

    $('#new').click();
})
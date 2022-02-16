
function jsGrid(nomeGrid,width,height){
	
	if(!nomeGrid)
		nomeGrid = "divJGrid";
	//Controla Height e Width do Grid
		//Valores padrões
		heightFixedRows = 24;
		if(!width)
			width = "500px";
		if(!height)
			height = "200px";
		//Tira o px do final do height
		strHeight = new String(height);
		if(strHeight.substring(strHeight.length-2,strHeight.length)=="px")
			height = strHeight.substring(0,strHeight.length-2);
		strWidth = new String(width);
		if(strWidth.substring(strWidth.length-2,strWidth.length)=="px")
			width = strWidth.substring(0,strWidth.length-2);			
		//Tirando a difereça das bordas
		width = width - 2;
		height = height -4;
	//====================================	
	var objContainer;
		if(document.getElementById(nomeGrid)){
			objContainer = document.getElementById(nomeGrid);
		}else{
			document.write("<div id="+nomeGrid+"></div>");
			objContainer = document.getElementById(nomeGrid);
		}

		var objDelimitFixedRows = document.createElement("div");
			objDelimitFixedRows.className = "JGridDelimitFixedRows";
			objDelimitFixedRows.style.width = width;
			objContainer.appendChild(objDelimitFixedRows);
		var objDivFixedRows = document.createElement("div");
			objDivFixedRows.className = "JGridFixedRowsContainer";
			objDivFixedRows.style.height = heightFixedRows+"px";
			objDelimitFixedRows.appendChild(objDivFixedRows);
		var objFixedRowsContainer;
			objFixedRowsContainer = document.createElement("table");
			objFixedRowsContainer.style.borderCollapse = "collapse";
			objFixedRowsContainer.setAttribute("border","1")
			objDivFixedRows.appendChild(objFixedRowsContainer);
		var objDivRows = document.createElement("div");
			objDivRows.className = "JGridRowsContainer";
			objDivRows.style.width = width;
			objDivRows.style.height = (height-heightFixedRows)+"px";
			addEvent(objDivRows,"scroll",m_DoScrollLeft,false);
			objContainer.appendChild(objDivRows);
		var objRowsContainer;
			objRowsContainer = document.createElement("table");
			objRowsContainer.style.borderCollapse = "collapse";
			objRowsContainer.setAttribute("border","1")
			objDivRows.appendChild(objRowsContainer);
	
	var fixedRows = 1;
	var g_IndexRow = 0;
	var g_NomeGrid = nomeGrid;
	
	this.rows = new ListaRow();
	this.setTextMatrix = function setTextMatrix(row,col,valor){return m_SetTextMatrix(row,col,valor,this.rows)};
	this.getTextMatrix = function getTextMatrix(row,col){return m_GetTextMatrix(row,col,this.rows)};
	
	//Row adicionada por causa da coluna fixa
	this.rows.add();
	
	function m_SetTextMatrix(row,col,valor,rows){
		rows.item(row).cells.item(col).setText(valor);
	}
	function m_GetTextMatrix(row,col,rows){
		return rows.item(row).cells.item(col).getText();
	}
	function m_DoScrollLeft(){
		objDelimitFixedRows.scrollLeft = objDivRows.scrollLeft;
		//objDivFixedRows.style.position = "relative";
		//objDivFixedRows.style.left = -objDivRows.scrollLeft;
	}
//============================CLASS LISTAROW ============================================
	function ListaRow(){
		var m_rows = new Array();
		var m_ColWidth = new Array();
		var m_cols = 1;
		var Me = this;
		m_ColWidth[0] = "50px";
		this.selectedRow = null;
		this.add = function add(){return m_Add();}
		this.item = function item(row){return m_item(row);}
		this.remove = function remove(row){return m_remove(row);}
		this.count = function count(){return m_Count();}
		this.addCol = function addCol(width){return m_AddCol(width)}
		this.setColWidth = function setColWidth(celPos,width){m_SetColWidth(celPos,width)}
		
		function m_SetColWidth(celPos,width){
			var row = 0;
			for(row=0;row<m_rows.length;row++){
				m_rows[row].setCellWidth(celPos,width);
			}
			m_ColWidth[celPos] = width;
		}
		function m_AddCol(width){
			if(!width)
				width = "50px";
			m_ColWidth[m_ColWidth.length] = width;
			
			var row = 0;
			for(row=0;row<m_rows.length;row++){
				m_rows[row].cells.add(width);
			}
			m_cols++;
		}
		function m_Count(){
			return m_rows.length;
		}
		function m_item(row){
			return m_rows[row];
		}
		function m_Add(){
			if(m_rows.length < fixedRows){
				m_rows[m_rows.length] = new Row(objFixedRowsContainer,m_cols,m_ColWidth);
				m_rows[m_rows.length-1].getObj().className = "JGridFixedRow";
			}
			else{
				m_rows[m_rows.length] = new Row(objRowsContainer,m_cols,m_ColWidth,Me);
				m_rows[m_rows.length-1].getObj().className = "JGridRow";
				//addEvent(m_rows[m_rows.length-1].getObj(),"click", new Function("aler('aaaa')"), false);
				//addEvent(m_rows[m_rows.length-1].getObj(),"click", teste, false);
			}
		}
		function m_remove(row){
			//var objRow = m_rows[row].getObj();
			//objRowsContainer.removeChild(objRow);
			if(isNaN(parseInt(row))){
				for(i=0;i<m_rows.length;i++)
				{
					if(m_rows[i]==row){
						row = i;
						break;
					}
				}
			}
			
			if(m_rows[row] == Me.selectedRow){
				Me.selectedRow = null;
			}
			if(row<fixedRows)
				objFixedRowsContainer.deleteRow(row);
			else
				objRowsContainer.deleteRow(row-fixedRows);
			m_rows.splice(row,1);
		}
		
	}
//=======================================================================================
 	
//============================CLASS ROW ============================================
	function Row(container,cols,colWidth,objParent){
		var m_Parent = objParent;
		var Me = this;
		var objContainer = container;
		var objRow;
			objRow = objContainer.insertRow(objContainer.rows.length);
			//container.appendChild(objRow);
		this.cells = new ListaCell(objRow,cols,colWidth);
		this.getObj = function getObj(){return m_GetObj()};
		this.setCellWidth = function setCellWidth(cellPos,width){m_SetCellWidth(cellPos,width,this.cells)}
		this.getItemData = function getItemData(){return m_GetItemData()}
		this.setItemData = function setItemData(valor){return m_SetItemData(valor)}
		this.remove = function remove(){m_remove()}
		
		var m_ItemDataName = g_NomeGrid+"_ItemData["+g_IndexRow+"]";
		//================
		var objInputItemdata = document.createElement("input");
		objInputItemdata.setAttribute("type","hidden");
		objInputItemdata.setAttribute("name",m_ItemDataName);
		objInputItemdata.setAttribute("id",m_ItemDataName);
		objRow.appendChild(objInputItemdata);
		g_IndexRow++;
		//=================

		if(m_Parent)
			addEvent(this.getObj(),"click", selecionaRow, false);
		
		function selecionaRow(){
			if(m_Parent.selectedRow){
				m_Parent.selectedRow.getObj().style.backgroundColor = '';
			}
			m_Parent.selectedRow = Me;
			m_Parent.selectedRow.getObj().style.backgroundColor = '#0099FF';
		}
		function m_remove(){
			m_Parent.remove(Me);
		}
		function m_SetCellWidth(cellPos,width,listaCell){
			listaCell.item(cellPos).setWidth(width);
		}
		function m_GetObj(){
			return objRow;
		}
		function m_SetItemData(valor){
			document.getElementById(m_ItemDataName).value = valor;
		}
		function m_GetItemData(){
			return document.getElementById(m_ItemDataName).value;
		}
	}
//=======================================================================================

//============================CLASS LISTACELL=============================================
	function ListaCell(container,cols,colWidth){
		var objContainer = container;
		var m_Cells = new Array();
		this.add = function add(width){return m_Add(width);}
		this.item = function item(cell){return m_item(cell);}
	
		var i = 0;
		for(i=0;i<cols;i++){
//			alert(colWidth[i]+" = "+i);
			this.add(colWidth[i]);
		}
		function m_Add(width){
			m_Cells[m_Cells.length] = new Cell(objContainer,width);
		}
		function m_item(cell){
			return m_Cells[cell];
		}			
	}
//=======================================================================================

//============================CLASS CELL==================================================
	function Cell(rowContainer,width){
		var objTd;
			objTd = rowContainer.insertCell(rowContainer.cells.length);
		var objCell = document.createElement("div");
			objCell.className = "JGridCell";
			objTd.appendChild(objCell);			
			
			//rowContainer.appendChild(objCell);
		this.getText = function getText(){return m_GetText();}
		this.setText = function setText(valor){return m_SetText(valor);}
		this.setWidth = function setWidth(valor){return m_SetWidth(valor);}
		
//		if(width)
			m_SetWidth(width);
//		else
//			m_SetWidth("50px");
		
		function m_GetText(){
			return objCell.innerHTML;
		}
		function m_SetText(valor){
			objCell.innerHTML = valor;
		}
		function m_SetWidth(valor){
			objCell.style.width = valor;
		}
	}
//=======================================================================================
	function addEvent(elm, evType, fn, useCapture)
	{
		if (elm.addEventListener) {
			elm.addEventListener(evType, fn, useCapture);
			return true;
		}else if (elm.attachEvent){
			var r = elm.attachEvent('on' + evType, fn);
			return r;
		}else {
			elm['on' + evType] = fn;
		}
	}

}